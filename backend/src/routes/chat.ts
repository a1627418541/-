import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { prisma } from '../utils/prisma.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { aiService } from '../services/ai.js'
import { getCharacter, buildSystemPrompt } from '../services/character.js'
import { calculateRelationshipStage, analyzeMessageImpact, checkEventTriggers } from '../services/game.js'
import { imageGenerationService } from '../services/imageGeneration.js'
import { r2Service } from '../services/r2.js'

const router = Router()

// Parse [SEND_PHOTO:photoId] from AI response and return { text, photoId }
function parsePhotoTag(response: string): { text: string; photoId: string | null } {
  const match = response.match(/\[SEND_PHOTO:([^\]]+)\]/)
  if (!match) return { text: response, photoId: null }
  const photoId = match[1].trim()
  const text = response.replace(/\[SEND_PHOTO:[^\]]+\]\s*/, '').trim()
  return { text, photoId }
}

// Parse [GENERATE_PHOTO:description] from AI response and return { text, description }
function parseGeneratePhotoTag(response: string): { text: string; description: string | null } {
  const match = response.match(/\[GENERATE_PHOTO:([^\]]+)\]/)
  if (!match) return { text: response, description: null }
  const description = match[1].trim()
  const text = response.replace(/\[GENERATE_PHOTO:[^\]]+\]\s*/, '').trim()
  return { text, description }
}

// Local fallback storage (used when R2 is not configured)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const generatedPhotosDir = path.resolve(__dirname, '../../public/photos/generated')
fs.mkdirSync(generatedPhotosDir, { recursive: true })

async function generateAndSavePhoto(
  description: string,
  characterName: string,
  avatarDescription: string
): Promise<string | null> {
  try {
    // 严格以角色头像形象为基准，确保人物一致性
    const enhancedPrompt =
      `3D写实风格，高质量，杰作，8k，${description}。` +
      `画面中的人物必须是：${characterName}，${avatarDescription}。` +
      `严格保持人物形象与头像完全一致，不要改变发型、五官、服装风格。`

    const imageUrl = await imageGenerationService.generateImage(enhancedPrompt, {
      size: '1024*1024',
      watermark: false,
    })

    // Download image buffer
    const res = await fetch(imageUrl)
    if (!res.ok) throw new Error(`Failed to download image: HTTP ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())

    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.png`

    // Try R2 first, fallback to local filesystem
    if (r2Service.isConfigured()) {
      const key = `generated/${filename}`
      const publicUrl = await r2Service.uploadImage(key, buffer)
      console.log('[Generate Photo] Uploaded to R2:', publicUrl)
      return publicUrl
    }

    // Fallback: save locally
    const filepath = path.join(generatedPhotosDir, filename)
    fs.writeFileSync(filepath, buffer)
    console.log('[Generate Photo] Saved locally:', filepath)
    return `/photos/generated/${filename}`
  } catch (err) {
    console.error('[Generate Photo] Failed:', err)
    return null
  }
}

router.post('/send', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { sessionId, content } = req.body
    const userId = req.user!.id

    const session = await prisma.gameSession.findFirst({
      where: { id: sessionId, userId },
      include: { gameState: true, messages: { orderBy: { createdAt: 'asc' } } },
    })

    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' })
      return
    }

    const character = getCharacter(session.characterKey)
    if (!character) {
      res.status(404).json({ success: false, error: 'Character not found' })
      return
    }

    // Save user message
    await prisma.chatMessage.create({
      data: { sessionId, role: 'user', content },
    })

    // Get current game state
    const gameState = session.gameState!
    const currentState = {
      affection: gameState.affection,
      trust: gameState.trust,
      mood: gameState.mood,
      relationshipStage: gameState.relationshipStage,
      triggeredEvents: JSON.parse(gameState.triggeredEvents),
      playerChoices: JSON.parse(gameState.playerChoices) as Record<string, string>,
    }

    // Analyze message impact on game state
    const impact = analyzeMessageImpact(content, character, currentState)
    const newAffection = Math.max(-100, Math.min(100, gameState.affection + impact.affectionDelta))
    const newTrust = Math.max(-50, Math.min(50, gameState.trust + impact.trustDelta))
    const newMood = impact.moodChange || gameState.mood
    const newStage = calculateRelationshipStage(newAffection)

    // Build context messages (last 20 messages for context window)
    const recentMessages = session.messages.slice(-20).map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }))

    const systemPrompt = buildSystemPrompt(character, {
      affection: newAffection,
      trust: newTrust,
      mood: newMood,
      relationshipStage: newStage,
      triggeredEvents: currentState.triggeredEvents,
    })

    // Check for event triggers
    const eventTrigger = checkEventTriggers(
      { ...currentState, affection: newAffection, trust: newTrust },
      character
    )

    // Generate AI response
    const aiMessages = [...recentMessages, { role: 'user' as const, content }]
    const aiResponse = await aiService.chatCompletion(aiMessages, systemPrompt)

    // Parse photo tags from AI response
    const { text: textAfterSendPhoto, photoId } = parsePhotoTag(aiResponse)
    const { text: textContent, description: generateDescription } = parseGeneratePhotoTag(textAfterSendPhoto)
    const messages: any[] = []

    // Save text message (always)
    const textMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: textContent,
        eventType: eventTrigger || undefined,
      },
    })
    messages.push(textMessage)

    // Handle SEND_PHOTO (existing photo)
    if (photoId) {
      const photo = character.photos.find(p => p.id === photoId)
      if (photo) {
        const photoMessage = await prisma.chatMessage.create({
          data: {
            sessionId,
            role: 'assistant',
            content: photo.description,
            messageType: 'image',
            imageUrl: photo.url,
          },
        })
        messages.push(photoMessage)
      }
    }

    // Handle GENERATE_PHOTO (AI generated photo)
    if (generateDescription) {
      const generatedUrl = await generateAndSavePhoto(generateDescription, character.name, character.avatarDescription)
      if (generatedUrl) {
        const photoMessage = await prisma.chatMessage.create({
          data: {
            sessionId,
            role: 'assistant',
            content: generateDescription,
            messageType: 'image',
            imageUrl: generatedUrl,
          },
        })
        messages.push(photoMessage)
      }
    }

    // Update game state
    const updatedTriggeredEvents = eventTrigger
      ? [...currentState.triggeredEvents, eventTrigger]
      : currentState.triggeredEvents

    await prisma.gameState.update({
      where: { sessionId },
      data: {
        affection: newAffection,
        trust: newTrust,
        mood: newMood,
        relationshipStage: newStage,
        triggeredEvents: JSON.stringify(updatedTriggeredEvents),
        lastInteractionAt: new Date(),
      },
    })

    // Update session timestamp
    await prisma.gameSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    })

    res.json({
      success: true,
      data: {
        messages,
        message: messages[0],
        gameState: {
          affection: newAffection,
          trust: newTrust,
          mood: newMood,
          relationshipStage: newStage,
        },
        event: eventTrigger,
      },
    })
  } catch (err) {
    console.error('Chat error:', err)
    res.status(500).json({ success: false, error: 'Failed to send message' })
  }
})

// Stream endpoint
router.post('/stream', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { sessionId, content } = req.body
    const userId = req.user!.id

    const session = await prisma.gameSession.findFirst({
      where: { id: sessionId, userId },
      include: { gameState: true, messages: { orderBy: { createdAt: 'asc' } } },
    })

    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' })
      return
    }

    const character = getCharacter(session.characterKey)
    if (!character) {
      res.status(404).json({ success: false, error: 'Character not found' })
      return
    }

    // Save user message
    await prisma.chatMessage.create({
      data: { sessionId, role: 'user', content },
    })

    const gameState = session.gameState!
    const currentState = {
      affection: gameState.affection,
      trust: gameState.trust,
      mood: gameState.mood,
      relationshipStage: gameState.relationshipStage,
      triggeredEvents: JSON.parse(gameState.triggeredEvents),
      playerChoices: JSON.parse(gameState.playerChoices) as Record<string, string>,
    }

    const impact = analyzeMessageImpact(content, character, currentState)
    const newAffection = Math.max(-100, Math.min(100, gameState.affection + impact.affectionDelta))
    const newTrust = Math.max(-50, Math.min(50, gameState.trust + impact.trustDelta))
    const newMood = impact.moodChange || gameState.mood
    const newStage = calculateRelationshipStage(newAffection)

    const recentMessages = session.messages.slice(-20).map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }))

    const systemPrompt = buildSystemPrompt(character, {
      affection: newAffection,
      trust: newTrust,
      mood: newMood,
      relationshipStage: newStage,
      triggeredEvents: currentState.triggeredEvents,
    })

    const eventTrigger = checkEventTriggers(
      { ...currentState, affection: newAffection, trust: newTrust },
      character
    )

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    let fullResponse = ''
    const aiMessages = [...recentMessages, { role: 'user' as const, content }]

    for await (const chunk of aiService.streamChat(aiMessages, systemPrompt)) {
      fullResponse += chunk
      res.write(`data: ${JSON.stringify({ chunk }) }\n\n`)
    }

    const { text: textAfterSendPhoto, photoId } = parsePhotoTag(fullResponse)
    const { text: textContent, description: generateDescription } = parseGeneratePhotoTag(textAfterSendPhoto)
    const messages: any[] = []

    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: textContent,
        eventType: eventTrigger || undefined,
      },
    })
    messages.push(assistantMessage)

    if (photoId) {
      const photo = character.photos.find(p => p.id === photoId)
      if (photo) {
        const photoMessage = await prisma.chatMessage.create({
          data: {
            sessionId,
            role: 'assistant',
            content: photo.description,
            messageType: 'image',
            imageUrl: photo.url,
          },
        })
        messages.push(photoMessage)
      }
    }

    if (generateDescription) {
      const generatedUrl = await generateAndSavePhoto(generateDescription, character.name, character.avatarDescription)
      if (generatedUrl) {
        const photoMessage = await prisma.chatMessage.create({
          data: {
            sessionId,
            role: 'assistant',
            content: generateDescription,
            messageType: 'image',
            imageUrl: generatedUrl,
          },
        })
        messages.push(photoMessage)
      }
    }

    const updatedTriggeredEvents = eventTrigger
      ? [...currentState.triggeredEvents, eventTrigger]
      : currentState.triggeredEvents

    await prisma.gameState.update({
      where: { sessionId },
      data: {
        affection: newAffection,
        trust: newTrust,
        mood: newMood,
        relationshipStage: newStage,
        triggeredEvents: JSON.stringify(updatedTriggeredEvents),
        lastInteractionAt: new Date(),
      },
    })

    await prisma.gameSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    })

    res.write(`data: ${JSON.stringify({ done: true, event: eventTrigger }) }\n\n`)
    res.end()
  } catch (err) {
    console.error('Stream error:', err)
    res.write(`data: ${JSON.stringify({ error: 'Stream failed' }) }\n\n`)
    res.end()
  }
})

export default router
