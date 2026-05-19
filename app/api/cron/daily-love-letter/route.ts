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
        user: { email: { not: '' } },
      },
      include: {
        user: true,
        gameState: true,
      },
    })

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
      try {
        const letter = await generateDailyLoveLetter(
          session.characterKey,
          session.gameState?.relationshipStage || 'stranger',
          session.gameState?.affection || 0
        )

        await sendLoveLetterEmail({
          to: session.user.email,
          nickname: session.user.nickname,
          characterName: characterNames[session.characterKey] || '你的她',
          subject: letter.subject,
          content: letter.content,
        })

        sentCount++
        console.log(`[Cron] Love letter sent to ${session.user.email} (${session.characterKey})`)
      } catch (err) {
        failCount++
        console.error(`[Cron] Failed to send love letter to ${session.user.email}:`, err)
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
