import { create } from 'zustand'
import { api } from '../services/api'

export interface Character {
  key: string
  name: string
  avatar: string
  title: string
  age: number
  occupation: string
  bio: string
}

export interface GameState {
  affection: number
  trust: number
  mood: string
  relationshipStage: string
}

export interface Message {
  id: string
  role: string
  content: string
  createdAt: string
  eventType?: string
  messageType?: string
  imageUrl?: string
}

interface GameStoreState {
  characters: Character[]
  currentSession: any | null
  messages: Message[]
  gameState: GameState | null
  isLoading: boolean
  error: string | null

  fetchCharacters: () => Promise<void>
  createSession: (characterKey: string) => Promise<boolean>
  loadSession: (sessionId: string) => Promise<boolean>
  sendMessage: (content: string) => Promise<boolean>
  sendMessageStream: (content: string, onUpdate: (text: string) => void) => Promise<void>
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  characters: [],
  currentSession: null,
  messages: [],
  gameState: null,
  isLoading: false,
  error: null,

  fetchCharacters: async () => {
    try {
      const res = await api.getCharacters()
      if (res.success) {
        set({ characters: res.data })
      }
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  createSession: async (characterKey: string) => {
    console.log('[gameStore] createSession', characterKey)
    set({ isLoading: true, error: null })
    try {
      const res = await api.createSession(characterKey)
      console.log('[gameStore] createSession response', res)
      set({
        currentSession: res.data,
        messages: res.data.messages || [],
        gameState: res.data.gameState,
        isLoading: false,
      })
      return true
    } catch (err: any) {
      console.error('[gameStore] createSession error', err)
      set({ error: err.message || 'Failed to create session', isLoading: false })
      return false
    }
  },

  loadSession: async (sessionId: string) => {
    console.log('[gameStore] loadSession', sessionId)
    set({ isLoading: true, error: null })
    try {
      const res = await api.getSession(sessionId)
      console.log('[gameStore] loadSession response', res)
      set({
        currentSession: res.data,
        messages: res.data.messages || [],
        gameState: res.data.gameState,
        isLoading: false,
      })
      return true
    } catch (err: any) {
      console.error('[gameStore] loadSession error', err)
      set({ error: err.message || 'Failed to load session', isLoading: false })
      return false
    }
  },

  sendMessage: async (content: string) => {
    const session = get().currentSession
    console.log('[gameStore] sendMessage called', { sessionId: session?.id, content, messagesCount: get().messages.length })
    if (!session) return false

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }

    set({ messages: [...get().messages, tempMessage], isLoading: true })

    try {
      const res = await api.sendMessage(session.id, content)
      const newMessages = res.data.messages || [res.data.message]
      const currentMessages = get().messages
      const messagesWithoutTemp = currentMessages.filter(m => !m.id.startsWith('temp-'))
      set({
        messages: [...messagesWithoutTemp, ...newMessages],
        gameState: res.data.gameState,
        isLoading: false,
      })
      return true
    } catch (err: any) {
      set({ error: err.message || 'Failed to send message', isLoading: false })
      return false
    }
  },

  sendMessageStream: async (content: string, onUpdate) => {
    const session = get().currentSession
    if (!session) return

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }

    set({ messages: [...get().messages, tempMessage], isLoading: true })

    let fullResponse = ''

    try {
      await api.streamMessage(session.id, content, (chunk) => {
        fullResponse += chunk
        onUpdate(fullResponse)
      })

      // After stream completes, reload session to get persisted message
      const res = await api.getSession(session.id)
      if (res.success) {
        set({
          currentSession: res.data,
          messages: res.data.messages || [],
          gameState: res.data.gameState,
          isLoading: false,
        })
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
    }
  },
}))
