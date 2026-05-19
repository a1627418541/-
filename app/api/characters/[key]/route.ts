import { NextResponse } from 'next/server'
import { getCharacter } from '@/lib/services/character'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params
  const character = getCharacter(key)
  if (!character) {
    return NextResponse.json(
      { success: false, error: 'Character not found' },
      { status: 404 }
    )
  }
  return NextResponse.json({ success: true, data: character })
}
