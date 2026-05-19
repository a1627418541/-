import { NextRequest, NextResponse } from 'next/server'
import { verifyTurnstile } from '@/lib/turnstile'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    const valid = await verifyTurnstile(token)
    if (valid) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { success: false, error: '验证失败' },
        { status: 400 }
      )
    }
  } catch (err) {
    return NextResponse.json(
      { success: false, error: '验证请求失败' },
      { status: 500 }
    )
  }
}
