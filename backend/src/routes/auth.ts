import { Router } from 'express'
import { prisma } from '../utils/prisma.js'
import { hashPassword, comparePassword, generateToken } from '../middleware/auth.js'
import type { AuthRequest } from '../types/index.js'

const router = Router()

router.post('/register', async (req, res) => {
  try {
    const { email, password, nickname } = req.body

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password required' })
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
    const { email, password } = req.body

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

export default router
