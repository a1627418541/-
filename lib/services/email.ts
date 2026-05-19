import { Resend } from 'resend'
import { config } from '@/lib/config'

/**
 * Email Service - Resend
 */
let resend: Resend | null = null

function getResend() {
  if (!resend) {
    if (!config.resendApiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }
    resend = new Resend(config.resendApiKey)
  }
  return resend
}

export function isEmailConfigured(): boolean {
  return !!config.resendApiKey
}

export interface LoveLetterEmail {
  to: string
  nickname: string | null
  characterName: string
  subject: string
  content: string
}

/**
 * Send a daily love letter email to a user
 */
export async function sendLoveLetterEmail(payload: LoveLetterEmail): Promise<void> {
  const { to, nickname, characterName, subject, content } = payload

  const resendClient = getResend()

  const displayName = nickname || '亲爱的'

  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fafafa; margin: 0; padding: 20px; }
    .container { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .header { text-align: center; margin-bottom: 24px; }
    .avatar { width: 64px; height: 64px; border-radius: 50%; background: #f43f5e; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 28px; }
    .name { font-size: 18px; font-weight: 600; color: #1a1a1a; margin-top: 12px; }
    .role { font-size: 13px; color: #888; margin-top: 4px; }
    .content { font-size: 15px; line-height: 1.8; color: #333; margin: 24px 0; padding: 20px; background: #fef2f2; border-radius: 12px; white-space: pre-wrap; }
    .footer { text-align: center; font-size: 12px; color: #bbb; margin-top: 24px; }
    .cta { display: inline-block; margin-top: 20px; padding: 12px 28px; background: #f43f5e; color: #fff; text-decoration: none; border-radius: 24px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="avatar">💌</div>
      <div class="name">${characterName}</div>
      <div class="role">给你的每日情话</div>
    </div>
    <p style="color:#666;font-size:14px;">Hi ${displayName}，${characterName}想对你说：</p>
    <div class="content">${content}</div>
    <div style="text-align:center;">
      <a href="#" class="cta">回复 ${characterName}</a>
    </div>
    <div class="footer">
      <p>恋爱模拟器 · 每天一句，温暖你的心</p>
      <p style="margin-top:8px;">如不想收到此类邮件，可在设置中关闭</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const { error } = await resendClient.emails.send({
    from: '恋爱模拟器 <daily@paper-lianai.com>',
    to,
    subject,
    html,
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }
}
