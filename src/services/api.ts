const API_BASE = '/api'

class ApiClient {
  private token: string | null = null

  setToken(token: string | null) {
    this.token = token
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    if (path === '/chat/send') {
      console.log('[ApiClient] request', { path, body: options.body })
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`)
    }

    if (typeof data === 'object' && data !== null && 'success' in data && data.success === false) {
      throw new Error(data.error || `Request failed with success=false`)
    }

    return data
  }

  // Auth
  async register(email: string, password: string, nickname?: string) {
    return this.request<{ success: boolean; data: { token: string; user: any } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, nickname }),
    })
  }

  async login(email: string, password: string) {
    return this.request<{ success: boolean; data: { token: string; user: any } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  // Characters
  async getCharacters() {
    return this.request<{ success: boolean; data: any[] }>('/characters')
  }

  async getCharacter(key: string) {
    return this.request<{ success: boolean; data: any }>(`/characters/${key}`)
  }

  // Game Sessions
  async createSession(characterKey: string) {
    return this.request<{ success: boolean; data: any }>('/game/sessions', {
      method: 'POST',
      body: JSON.stringify({ characterKey }),
    })
  }

  async getSessions() {
    return this.request<{ success: boolean; data: any[] }>('/game/sessions')
  }

  async getSession(id: string) {
    return this.request<{ success: boolean; data: any }>(`/game/sessions/${id}`)
  }

  // Chat
  async sendMessage(sessionId: string, content: string) {
    return this.request<{ success: boolean; data: any }>('/chat/send', {
      method: 'POST',
      body: JSON.stringify({ sessionId, content }),
    })
  }

  async streamMessage(sessionId: string, content: string, onChunk: (chunk: string) => void) {
    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify({ sessionId, content }),
    })

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
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        try {
          const parsed = JSON.parse(data)
          if (parsed.chunk) onChunk(parsed.chunk)
          if (parsed.done) return parsed
        } catch {
          // ignore
        }
      }
    }
  }
}

export const api = new ApiClient()
