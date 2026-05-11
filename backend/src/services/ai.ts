import { config } from '../config/index.js'
import type { ChatMessage } from '../types/index.js'

/**
 * AI Service - Unified interface for Kimi / Doubao
 * Supports Cloudflare AI Gateway via AI_BASE_URL
 */
export class AIService {
  private apiKey: string
  private baseUrl: string
  private model: string
  private temperature: number

  constructor() {
    // Prefer unified AI configs, fallback to legacy Kimi configs
    this.apiKey = config.aiApiKey || config.kimiApiKey
    this.baseUrl = config.aiBaseUrl || config.kimiBaseUrl
    this.model = config.aiModel || config.kimiModel
    this.temperature = config.aiTemperature
  }

  private ensureConfig() {
    if (!this.apiKey) {
      throw new Error('AI API Key not configured. Set AI_API_KEY or KIMI_API_KEY.')
    }
    if (!this.baseUrl) {
      throw new Error('AI Base URL not configured. Set AI_BASE_URL or KIMI_API_BASE.')
    }
    if (!this.model) {
      throw new Error('AI Model not configured. Set AI_MODEL or KIMI_MODEL.')
    }
  }

  async *streamChat(
    messages: ChatMessage[],
    systemPrompt?: string
  ): AsyncGenerator<string, void, unknown> {
    this.ensureConfig()
    const allMessages: ChatMessage[] = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: allMessages,
        stream: true,
        temperature: this.temperature,
      }),
    })

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error')
      throw new Error(`AI API error (${response.status}): ${error}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data:')) continue

        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') return

        try {
          const parsed = JSON.parse(data)
          const delta = parsed.choices?.[0]?.delta?.content
          if (delta) yield delta
        } catch {
          // ignore parse errors
        }
      }
    }
  }

  async chatCompletion(
    messages: ChatMessage[],
    systemPrompt?: string
  ): Promise<string> {
    this.ensureConfig()
    const allMessages: ChatMessage[] = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages

    const body = {
      model: this.model,
      messages: allMessages,
      temperature: this.temperature,
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error')
      throw new Error(`AI API error (${response.status}): ${error}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  }
}

export const aiService = new AIService()
