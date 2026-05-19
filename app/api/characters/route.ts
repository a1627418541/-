import { NextResponse } from 'next/server'
import { getAllCharacters } from '@/lib/services/character'

export async function GET() {
  const characters = getAllCharacters().map(c => ({
    key: c.key,
    name: c.name,
    avatar: c.avatar,
    coverImage: c.photos?.[0]?.url || c.avatar,
    title: c.title,
    age: c.age,
    occupation: c.occupation,
    bio: c.bio,
  }))
  return NextResponse.json({ success: true, data: characters })
}
