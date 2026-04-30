export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface SendMessageRequest {
  sessionId: string
  content: string
}

export interface CreateSessionRequest {
  characterKey: string
}

export interface AuthRequest {
  email: string
  password: string
  nickname?: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// Character profile types (mirroring frontend)
export interface CharacterPhoto {
  id: string
  url: string
  description: string
  scene: string
}

export interface CharacterProfile {
  key: string
  name: string
  avatar: string
  title: string
  age: number
  occupation: string
  bio: string
  background: string
  speakingStyle: string
  catchphrases: string[]
  careActions: string[]
  upsetTriggers: string[]
  loveThreshold: 'low' | 'medium' | 'high' | 'extreme'
  loveConfession: string
  photos: CharacterPhoto[]
}
