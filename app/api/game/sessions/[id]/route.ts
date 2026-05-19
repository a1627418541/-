import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const session = await prisma.gameSession.findFirst({
      where: { id, userId: user.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        gameState: true,
      },
    })
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: session })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to fetch session' }, { status: 500 })
  }
}
