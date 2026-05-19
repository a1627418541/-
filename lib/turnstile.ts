import { config } from './config'

export async function verifyTurnstile(token: string): Promise<boolean> {
  if (!config.turnstileSecretKey) {
    console.warn('[Turnstile] TURNSTILE_SECRET_KEY not configured, skipping verification')
    return true
  }
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: config.turnstileSecretKey,
        response: token,
      }),
    })
    const data = await res.json() as { success: boolean }
    return data.success
  } catch (err) {
    console.error('[Turnstile] verification error:', err)
    return false
  }
}
