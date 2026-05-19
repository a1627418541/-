import { NextResponse } from 'next/server'

export async function GET() {
  const isConfigured = !!process.env.DASHSCOPE_API_KEY
  return NextResponse.json({
    success: true,
    data: {
      configured: isConfigured,
      model: process.env.DASHSCOPE_IMAGE_MODEL || 'qwen-image-2.0-pro',
    },
  })
}
