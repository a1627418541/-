import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { r2Service } from '@/lib/services/r2'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_VOICE_TYPES = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string || 'image' // 'image' | 'voice'

    if (!file) {
      return NextResponse.json({ error: '缺少文件' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '文件大小超过 10MB 限制' }, { status: 400 })
    }

    const allowedTypes = type === 'voice' ? ALLOWED_VOICE_TYPES : ALLOWED_IMAGE_TYPES
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `不支持的文件类型: ${file.type}` },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop() || (type === 'voice' ? 'webm' : 'png')
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`
    const key = `${type === 'voice' ? 'voice' : 'uploads'}/${filename}`

    if (!r2Service.isConfigured()) {
      return NextResponse.json({ error: '存储服务未配置' }, { status: 500 })
    }

    const url = await r2Service.uploadImage(key, buffer, file.type)

    return NextResponse.json({ success: true, url, type })
  } catch (err: any) {
    console.error('[Upload] error:', err)
    return NextResponse.json(
      { error: err.message || '上传失败' },
      { status: 500 }
    )
  }
}
