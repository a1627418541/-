import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { aiService } from '@/lib/services/ai'
import { getCharacter, buildSystemPrompt } from '@/lib/services/character'
import { calculateRelationshipStage, analyzeMessageImpact, checkEventTriggers } from '@/lib/services/game'
import { imageGenerationService } from '@/lib/services/imageGeneration'
import { r2Service } from '@/lib/services/r2'
import fs from 'fs'
import path from 'path'

function parsePhotoTag(response: string): { text: string; photoId: string | null } {
  const match = response.match(/\[SEND_PHOTO:([^\]]+)\]/)
  if (!match) return { text: response, photoId: null }
  const photoId = match[1].trim()
  const text = response.replace(/\[SEND_PHOTO:[^\]]+\]\s*/, '').trim()
  return { text, photoId }
}

function parseGeneratePhotoTag(response: string): { text: string; description: string | null } {
  const match = response.match(/\[GENERATE_PHOTO:([^\]]+)\]/)
  if (!match) return { text: response, description: null }
  const description = match[1].trim()
  const text = response.replace(/\[GENERATE_PHOTO:[^\]]+\]\s*/, '').trim()
  return { text, description }
}

const generatedPhotosDir = path.resolve(process.cwd(), 'public/photos/generated')
fs.mkdirSync(generatedPhotosDir, { recursive: true })

async function generateAndSavePhoto(
  description: string,
  characterName: string,
  avatarDescription: string
): Promise<string | null> {
  try {
    const enhancedPrompt =
      `3D写实风格，高质量，杰作，8k，${description}。` +
      `画面中的人物必须是：${characterName}，${avatarDescription}。` +
      `严格保持人物形象与头像完全一致，不要改变发型、五官、服装风格。`

    const imageUrl = await imageGenerationService.generateImage(enhancedPrompt, {
      size: '1024*1024',
      watermark: false,
    })

    const res = await fetch(imageUrl)
    if (!res.ok) throw new Error(`Failed to download image: HTTP ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())

    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.png`

    if (r2Service.isConfigured()) {
      const key = `generated/${filename}`
      const publicUrl = await r2Service.uploadImage(key, buffer)
      console.log('[Generate Photo] Uploaded to R2:', publicUrl)
      return publicUrl
    }

    const filepath = path.join(generatedPhotosDir, filename)
    fs.writeFileSync(filepath, buffer)
    console.log('[Generate Photo] Saved locally:', filepath)
    return `/photos/generated/${filename}`
  } catch (err) {
    console.error('[Generate Photo] Failed:', err)
    return null
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { sessionId, content } = await request.json()

  const session = await prisma.gameSession.findFirst({
    where: { id: sessionId, userId: user.id },
    include: { gameState: true, messages: { orderBy: { createdAt: 'asc' } } },
  })

  if (!session) {
    return new Response('Session not found', { status: 404 })
  }

  const character = getCharacter(session.characterKey)
  if (!character) {
    return new Response('Character not found', { status: 404 })
  }

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

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let fullResponse = ''
      const aiMessages = [...recentMessages, { role: 'user' as const, content }]

      try {
        for await (const chunk of aiService.streamChat(aiMessages, systemPrompt)) {
          fullResponse += chunk
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`)
          )
        }

        const { text: textAfterSendPhoto, photoId } = parsePhotoTag(fullResponse)
        const { text: textContent, description: generateDescription } = parseGeneratePhotoTag(textAfterSendPhoto)

        const assistantMessage = await prisma.chatMessage.create({
          data: {
            sessionId,
            role: 'assistant',
            content: textContent,
            eventType: eventTrigger || undefined,
          },
        })

        if (photoId) {
          const photo = character.photos.find(p => p.id === photoId)
          if (photo) {
            await prisma.chatMessage.create({
              data: {
                sessionId,
                role: 'assistant',
                content: photo.description,
                messageType: 'image',
                imageUrl: photo.url,
              },
            })
          }
        }

        if (generateDescription) {
          const generatedUrl = await generateAndSavePhoto(generateDescription, character.name, character.avatarDescription)
          if (generatedUrl) {
            await prisma.chatMessage.create({
              data: {
                sessionId,
                role: 'assistant',
                content: generateDescription,
                messageType: 'image',
                imageUrl: generatedUrl,
              },
            })
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

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, event: eventTrigger })}\n\n`)
        )
        controller.close()
      } catch (err) {
        console.error('Stream error:', err)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`)
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
