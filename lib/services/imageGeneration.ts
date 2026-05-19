import { config } from '@/lib/config'

interface QwenImageResponse {
  output?: {
    choices?: Array<{
      finish_reason?: string
      message?: {
        role?: string
        content?: Array<{
          image?: string
          text?: string
        }>
      }
    }>
  }
  usage?: {
    height?: number
    width?: number
    image_count?: number
  }
  request_id?: string
}

/**
 * Image Generation Service - Qwen-Wanxiang (千问万相)
 * Supports generating images from text prompts
 */
export class ImageGenerationService {
  private apiKey: string
  private model: string
  private baseUrl: string

  constructor() {
    this.apiKey = config.dashscopeApiKey
    this.model = config.dashscopeImageModel
    this.baseUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
  }

  private ensureConfig() {
    if (!this.apiKey) {
      throw new Error('DashScope API Key not configured. Set DASHSCOPE_API_KEY.')
    }
  }

  /**
   * Generate an image from a text prompt
   * @param prompt - Text description of the desired image
   * @param options - Optional generation parameters
   * @returns URL of the generated image (valid for 24 hours)
   */
  async generateImage(
    prompt: string,
    options: {
      size?: string
      watermark?: boolean
      promptExtend?: boolean
      negativePrompt?: string
      n?: number
      seed?: number
    } = {}
  ): Promise<string> {
    this.ensureConfig()

    const {
      size = '1024*1024',
      watermark = false,
      promptExtend = true,
      negativePrompt = '',
      n = 1,
      seed,
    } = options

    const body: Record<string, any> = {
      model: this.model,
      input: {
        messages: [
          {
            role: 'user',
            content: [{ text: prompt }],
          },
        ],
      },
      parameters: {
        size,
        watermark,
        prompt_extend: promptExtend,
        n,
      },
    }

    if (negativePrompt) {
      body.parameters.negative_prompt = negativePrompt
    }

    if (seed !== undefined) {
      body.parameters.seed = seed
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error')
      throw new Error(`Image generation API error (${response.status}): ${error}`)
    }

    const data: QwenImageResponse = await response.json()
    const imageUrl = data.output?.choices?.[0]?.message?.content?.[0]?.image

    if (!imageUrl) {
      console.error('Image generation response:', JSON.stringify(data, null, 2))
      throw new Error('No image URL in response')
    }

    return imageUrl
  }

  /**
   * Download an image from a URL and save to disk
   * @param imageUrl - URL of the image to download
   * @param outputPath - Path to save the image
   */
  async downloadImage(imageUrl: string, outputPath: string): Promise<void> {
    const res = await fetch(imageUrl)
    if (!res.ok) {
      throw new Error(`Failed to download image: HTTP ${res.status}`)
    }

    const fs = await import('fs')
    const buffer = Buffer.from(await res.arrayBuffer())
    fs.writeFileSync(outputPath, buffer)
  }
}

export const imageGenerationService = new ImageGenerationService()
