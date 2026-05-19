import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { imageGenerationService } from '@/lib/services/imageGeneration'

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { prompt, size = '1024*1024' } = await request.json()
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 })
    }

    const imageUrl = await imageGenerationService.generateImage(prompt, { size })
    return NextResponse.json({ success: true, data: { url: imageUrl, prompt, size } })
  } catch (err: any) {
    console.error('[Image Generation] Error:', err.message)
    return NextResponse.json(
      { success: false, error: err.message || 'Image generation failed' },
      { status: 500 }
    )
  }
}
