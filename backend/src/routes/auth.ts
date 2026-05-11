import { Router } from 'express'
import { prisma } from '../utils/prisma.js'
import { hashPassword, comparePassword, generateToken } from '../middleware/auth.js'
import { config } from '../config/index.js'
import type { AuthRequest } from '../types/index.js'

const router = Router()

async function verifyTurnstile(token: string): Promise<boolean> {
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

router.post('/register', async (req, res) => {
  try {
    const { email, password, nickname, turnstileToken } = req.body

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password required' })
      return
    }

    const turnstileValid = await verifyTurnstile(turnstileToken)
    if (!turnstileValid) {
      res.status(400).json({ success: false, error: '人机验证失败，请重试' })
      return
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      res.status(409).json({ success: false, error: 'Email already registered' })
      return
    }

    const hashed = await hashPassword(password)
    const user = await prisma.user.create({
      data: { email, password: hashed, nickname: nickname || email.split('@')[0] },
    })

    const token = generateToken(user.id, user.email)
    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, nickname: user.nickname },
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Registration failed' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password, turnstileToken } = req.body

    const turnstileValid = await verifyTurnstile(turnstileToken)
    if (!turnstileValid) {
      res.status(400).json({ success: false, error: '人机验证失败，请重试' })
      return
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' })
      return
    }

    const valid = await comparePassword(password, user.password)
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid credentials' })
      return
    }

    const token = generateToken(user.id, user.email)
    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, nickname: user.nickname },
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Login failed' })
  }
})

router.post('/verify-turnstile', async (req, res) => {
  try {
    const { token } = req.body
    const valid = await verifyTurnstile(token)
    if (valid) {
      res.json({ success: true })
    } else {
      res.status(400).json({ success: false, error: '验证失败' })
    }
  } catch (err) {
    res.status(500).json({ success: false, error: '验证请求失败' })
  }
})

export default router
