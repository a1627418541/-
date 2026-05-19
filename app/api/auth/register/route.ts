import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'
import { verifyTurnstile } from '@/lib/turnstile'

export async function POST(request: NextRequest) {
  try {
    const { email, password, nickname, turnstileToken } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      )
    }

    const turnstileValid = await verifyTurnstile(turnstileToken)
    if (!turnstileValid) {
      return NextResponse.json(
        { success: false, error: '人机验证失败，请重试' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      )
    }

    const hashed = await hashPassword(password)
    const user = await prisma.user.create({
      data: { email, password: hashed, nickname: nickname || email.split('@')[0] },
    })

    const token = generateToken(user.id, user.email)
    return NextResponse.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, nickname: user.nickname },
      },
    })
  } catch (err) {
    console.error('Registration error:', err)
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    )
  }
}
