import { Router } from 'express'
import { prisma } from '../utils/prisma.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { aiService } from '../services/ai.js'
import { getCharacter, buildSystemPrompt } from '../services/character.js'
import { calculateRelationshipStage, analyzeMessageImpact, checkEventTriggers } from '../services/game.js'

const router = Router()

// Parse [SEND_PHOTO:photoId] from AI response and return { text, photoId }
function parsePhotoTag(response: string): { text: string; photoId: string | null } {
  const match = response.match(/\[SEND_PHOTO:([^\]]+)\]/)
  if (!match) return { text: response, photoId: null }
  const photoId = match[1].trim()
  const text = response.replace(/\[SEND_PHOTO:[^\]]+\]\s*/, '').trim()
  return { text, photoId }
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

    // Parse photo tag from AI response
    const { text: textContent, photoId } = parsePhotoTag(aiResponse)
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

    // Save photo message if photo tag present
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

    const { text: textContent, photoId } = parsePhotoTag(fullResponse)
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
