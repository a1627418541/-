import cron from 'node-cron'
import { prisma } from '../utils/prisma.js'
import { aiService } from '../services/ai.js'
import { getCharacter, buildSystemPrompt } from '../services/character.js'

/**
 * Cron Jobs - Daily good morning messages
 *
 * Runs every day at 8:00 AM.
 * For active sessions with no messages in the last 24h,
 * the character sends a good morning message.
 */

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

async function sendGoodMorningMessages() {
  console.log('[Cron] Starting good morning job at', new Date().toISOString())

  // Find all active sessions
  const sessions = await prisma.gameSession.findMany({
    where: { endedAt: null },
    include: {
      user: true,
      gameState: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  let sentCount = 0

  for (const session of sessions) {
    const lastMessage = session.messages[0]
    const lastMessageTime = lastMessage?.createdAt || session.createdAt
    const hoursSinceLastMessage =
      (Date.now() - lastMessageTime.getTime()) / (1000 * 60 * 60)

    // Only send if last message is older than 24h
    if (hoursSinceLastMessage < 24) continue

    const character = getCharacter(session.characterKey)
    if (!character) {
      console.warn('[Cron] Unknown character:', session.characterKey)
      continue
    }

    try {
      // Build system prompt for the character
      const systemPrompt = buildSystemPrompt(character, {
        affection: session.gameState?.affection ?? 0,
        trust: session.gameState?.trust ?? 0,
        mood: session.gameState?.mood ?? 'neutral',
        relationshipStage: session.gameState?.relationshipStage ?? 'stranger',
        triggeredEvents: JSON.parse(session.gameState?.triggeredEvents || '[]'),
      })

      // Add morning context
      const morningPrompt = `${systemPrompt}\n\n【当前情境】\n现在是早上。你刚刚醒来，想起对方已经有一段时间没发消息了。请自然地发送一条早安问候，表达你想到对方了。简短、真实，像真实微信聊天一样。`

      // Generate morning message via AI
      const content = await aiService.chatCompletion(
        [{ role: 'user', content: '（系统提示：请发送早安消息）' }],
        morningPrompt
      )

      if (!content.trim()) {
        console.warn('[Cron] Empty AI response for session', session.id)
        continue
      }

      // Save the message
      await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'assistant',
          content: content.trim(),
          messageType: 'text',
        },
      })

      // Update last interaction time
      if (session.gameState) {
        await prisma.gameState.update({
          where: { id: session.gameState.id },
          data: { lastInteractionAt: new Date() },
        })
      }

      sentCount++
      console.log(
        `[Cron] Sent good morning to user ${session.userId} from ${character.name}:`,
        content.slice(0, 50) + (content.length > 50 ? '...' : '')
      )
    } catch (err) {
      console.error('[Cron] Failed to send good morning for session', session.id, err)
    }
  }

  console.log(`[Cron] Good morning job finished. Sent ${sentCount} messages.`)
}

/**
 * Start all cron jobs
 */
export function startCronJobs() {
  // Run at 8:00 AM every day (China timezone handled by server locale)
  const job = cron.schedule('0 8 * * *', sendGoodMorningMessages, {
    timezone: 'Asia/Shanghai',
  })

  console.log('[Cron] Daily good morning job scheduled for 08:00 Asia/Shanghai')

  // Optionally run immediately on startup for testing
  // sendGoodMorningMessages()

  return job
}
