import { config } from '@/lib/config'

interface TaskSubmitResponse {
  output?: {
    task_id?: string
    task_status?: string
  }
  request_id?: string
}

interface TaskResultResponse {
  output?: {
    task_id?: string
    task_status?: string
    results?: Array<{
      url?: string
      code?: string
      message?: string
    }>
    task_metrics?: {
      TOTAL_IMAGE?: number
    }
  }
  request_id?: string
}

/**
 * Image Generation Service - DashScope Wanxiang (通义万相)
 * Uses async task API with polling
 */
export class ImageGenerationService {
  private apiKey: string
  private model: string
  private submitUrl: string

  constructor() {
    this.apiKey = config.dashscopeApiKey
    this.model = config.dashscopeImageModel
    this.submitUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis'
  }

  private ensureConfig() {
    if (!this.apiKey) {
      throw new Error('DashScope API Key not configured. Set DASHSCOPE_API_KEY.')
    }
  }

  private async submitTask(
    prompt: string,
    parameters: Record<string, any>
  ): Promise<string> {
    const body = {
      model: this.model,
      input: { prompt },
      parameters,
    }

    const response = await fetch(this.submitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-DashScope-Async': 'enable',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error')
      throw new Error(`Image generation submit error (${response.status}): ${error}`)
    }

    const data: TaskSubmitResponse = await response.json()
    const taskId = data.output?.task_id

    if (!taskId) {
      console.error('Task submit response:', JSON.stringify(data, null, 2))
      throw new Error('No task_id in submit response')
    }

    return taskId
  }

  private async pollTaskResult(taskId: string, maxWaitMs = 120000): Promise<string> {
    const pollInterval = 2000
    const startTime = Date.now()
    const taskUrl = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`

    while (Date.now() - startTime < maxWaitMs) {
      const response = await fetch(taskUrl, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        const error = await response.text().catch(() => 'Unknown error')
        throw new Error(`Task polling error (${response.status}): ${error}`)
      }

      const data: TaskResultResponse = await response.json()
      const status = data.output?.task_status

      if (status === 'SUCCEEDED') {
        const url = data.output?.results?.[0]?.url
        if (url) return url
        throw new Error('Task succeeded but no image URL found')
      }

      if (status === 'FAILED') {
        const msg = data.output?.results?.[0]?.message || 'Unknown failure'
        throw new Error(`Image generation failed: ${msg}`)
      }

      await new Promise(r => setTimeout(r, pollInterval))
    }

    throw new Error('Image generation timed out')
  }

  /**
   * Generate an image from a text prompt
   * @param prompt - Text description of the desired image
   * @param options - Optional generation parameters
   * @returns URL of the generated image
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

    const parameters: Record<string, any> = {
      size,
      watermark,
      prompt_extend: promptExtend,
      n,
    }

    if (negativePrompt) {
      parameters.negative_prompt = negativePrompt
    }

    if (seed !== undefined) {
      parameters.seed = seed
    }

    const taskId = await this.submitTask(prompt, parameters)
    const imageUrl = await this.pollTaskResult(taskId)

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
