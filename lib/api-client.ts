const API_BASE = ''

class ApiClient {
  private token: string | null = null

  setToken(token: string | null) {
    this.token = token
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
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

  async register(email: string, password: string, nickname?: string, turnstileToken?: string) {
    return this.request<{ success: boolean; data: { token: string; user: any } }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, nickname, turnstileToken }),
    })
  }

  async login(email: string, password: string, turnstileToken?: string) {
    return this.request<{ success: boolean; data: { token: string; user: any } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, turnstileToken }),
    })
  }

  async getCharacters() {
    return this.request<{ success: boolean; data: any[] }>('/api/characters')
  }

  async getCharacter(key: string) {
    return this.request<{ success: boolean; data: any }>(`/api/characters/${key}`)
  }

  async createSession(characterKey: string) {
    return this.request<{ success: boolean; data: any }>('/api/game/sessions', {
      method: 'POST',
      body: JSON.stringify({ characterKey }),
    })
  }

  async getSessions() {
    return this.request<{ success: boolean; data: any[] }>('/api/game/sessions')
  }

  async getSession(id: string) {
    return this.request<{ success: boolean; data: any }>(`/api/game/sessions/${id}`)
  }

  async sendMessage(sessionId: string, content: string) {
    return this.request<{ success: boolean; data: any }>('/api/chat/send', {
      method: 'POST',
      body: JSON.stringify({ sessionId, content }),
    })
  }

  async streamMessage(sessionId: string, content: string, onChunk: (chunk: string) => void) {
    const response = await fetch(`${API_BASE}/api/chat/stream`, {
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
