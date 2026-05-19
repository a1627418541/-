import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { getCharacter } from '@/lib/services/character'

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sessions = await prisma.gameSession.findMany({
      where: { userId: user.id },
      include: { gameState: true, _count: { select: { messages: true } } },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: sessions })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { characterKey } = await request.json()
    const character = getCharacter(characterKey)
    if (!character) {
      return NextResponse.json({ success: false, error: 'Character not found' }, { status: 404 })
    }

    const session = await prisma.gameSession.create({
      data: {
        userId: user.id,
        characterKey,
        gameState: {
          create: {
            affection: 0,
            trust: 0,
            mood: 'neutral',
            relationshipStage: 'stranger',
            triggeredEvents: '[]',
            playerChoices: '{}',
          },
        },
      },
      include: { gameState: true },
    })

    return NextResponse.json({ success: true, data: session })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to create session' }, { status: 500 })
  }
}
