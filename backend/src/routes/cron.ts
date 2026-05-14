import { Router } from 'express'
import { prisma } from '../utils/prisma.js'
import { config } from '../config/index.js'
import { generateDailyLoveLetter } from '../services/loveLetter.js'
import { sendLoveLetterEmail, isEmailConfigured } from '../services/email.js'

const router = Router()

/**
 * GET /api/cron/daily-love-letter
 *
 * Triggered by external cron service (e.g. cron-job.org)
 * Requires Authorization: Bearer <CRON_SECRET>
 */
router.get('/daily-love-letter', async (req, res) => {
  // Step 1: Validate request
  const authHeader = req.headers.authorization || ''
  if (authHeader !== `Bearer ${config.cronSecret}`) {
    res.status(401).json({ error: '未授权访问' })
    return
  }

  // Step 2: Check if email service is configured
  if (!isEmailConfigured()) {
    res.status(500).json({ error: '邮件服务未配置' })
    return
  }

  // Step 3: Execute task
  try {
    // Find all active sessions with users who have emails
    const sessions = await prisma.gameSession.findMany({
      where: {
        endedAt: null,
        user: { email: { not: '' } },
      },
      include: {
        user: true,
        gameState: true,
      },
    })

    let sentCount = 0
    let failCount = 0

    for (const session of sessions) {
      try {
        const letter = await generateDailyLoveLetter(
          session.characterKey,
          session.gameState?.relationshipStage || 'stranger',
          session.gameState?.affection || 0
        )

        const characterNames: Record<string, string> = {
          linxiaonuan: '林晓暖',
          guxingchen: '顾星辰',
          xiaxiaokui: '夏小葵',
          shenqiuqiu: '沈清秋',
          sutong: '苏瞳',
        }

        await sendLoveLetterEmail({
          to: session.user.email,
          nickname: session.user.nickname,
          characterName: characterNames[session.characterKey] || '你的她',
          subject: letter.subject,
          content: letter.content,
        })

        sentCount++
        console.log(
          `[Cron] Love letter sent to ${session.user.email} (${session.characterKey})`
        )
      } catch (err) {
        failCount++
        console.error(
          `[Cron] Failed to send love letter to ${session.user.email}:`,
          err
        )
      }
    }

    res.json({
      success: true,
      message: '每日情话发送完成',
      sent: sentCount,
      failed: failCount,
      time: new Date().toISOString(),
    })
  } catch (error) {
    console.error('每日情话发送失败：', error)
    res.status(500).json({ error: '发送失败' })
  }
})

export default router
