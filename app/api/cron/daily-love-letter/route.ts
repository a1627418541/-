import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { config } from '@/lib/config'
import { generateDailyLoveLetter } from '@/lib/services/loveLetter'
import { sendLoveLetterEmail, isEmailConfigured } from '@/lib/services/email'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || ''
  if (authHeader !== `Bearer ${config.cronSecret}`) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 })
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({ error: '邮件服务未配置' }, { status: 500 })
  }

  try {
    const sessions = await prisma.gameSession.findMany({
      where: {
        endedAt: null,
      },
      include: {
        gameState: true,
      },
    })

    const userIds = [...new Set(sessions.map((s) => s.userId))]
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        email: { not: '' },
      },
    })

    const userMap = new Map(users.map((u) => [u.id, u]))

    let sentCount = 0
    let failCount = 0

    const characterNames: Record<string, string> = {
      linxiaonuan: '林晓暖',
      guxingchen: '顾星辰',
      xiaxiaokui: '夏小葵',
      shenqiuqiu: '沈清秋',
      sutong: '苏瞳',
    }

    for (const session of sessions) {
      const user = userMap.get(session.userId)
      if (!user) {
        failCount++
        continue
      }

      try {
        const letter = await generateDailyLoveLetter(
          session.characterKey,
          session.gameState?.relationshipStage || 'stranger',
          session.gameState?.affection || 0
        )

        await sendLoveLetterEmail({
          to: user.email,
          nickname: user.name || '用户',
          characterName: characterNames[session.characterKey] || '你的她',
          subject: letter.subject,
          content: letter.content,
        })

        sentCount++
        console.log(`[Cron] Love letter sent to ${user.email} (${session.characterKey})`)
      } catch (err) {
        failCount++
        console.error(`[Cron] Failed to send love letter to ${user.email}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      message: '每日情话发送完成',
      sent: sentCount,
      failed: failCount,
      time: new Date().toISOString(),
    })
  } catch (error) {
    console.error('每日情话发送失败：', error)
    return NextResponse.json({ error: '发送失败' }, { status: 500 })
  }
}
