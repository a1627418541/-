import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, generateToken } from '@/lib/auth'
import { verifyTurnstile } from '@/lib/turnstile'

export async function POST(request: NextRequest) {
  try {
    const { email, password, turnstileToken } = await request.json()

    const turnstileValid = await verifyTurnstile(turnstileToken)
    if (!turnstileValid) {
      return NextResponse.json(
        { success: false, error: '人机验证失败，请重试' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const valid = await comparePassword(password, user.password)
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const token = generateToken(user.id, user.email)
    return NextResponse.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, nickname: user.nickname },
      },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}
