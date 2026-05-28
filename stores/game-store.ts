'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { api } from '@/lib/api-client'

export interface Character {
  key: string
  name: string
  avatar: string
  coverImage: string
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
  sessions: any[]
  currentSession: any | null
  messages: Message[]
  gameState: GameState | null
  isLoading: boolean
  error: string | null

  fetchCharacters: () => Promise<void>
  fetchSessions: () => Promise<void>
  createSession: (characterKey: string) => Promise<boolean>
  loadSession: (sessionId: string) => Promise<boolean>
  sendMessage: (content: string) => Promise<boolean>
  sendMessageStream: (content: string, imageUrl?: string) => Promise<void>
  sendImage: (file: File) => Promise<boolean>
  sendVoice: (blob: Blob, duration: number) => Promise<boolean>
}

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      characters: [],
      sessions: [],
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

      fetchSessions: async () => {
        try {
          const res = await api.getSessions()
          if (res.success) {
            set({ sessions: res.data })
            const { currentSession } = get()
            if (!currentSession && res.data.length > 0) {
              const latest = res.data[0]
              set({ currentSession: latest })
            }
          }
        } catch (err: any) {
          console.error('[gameStore] fetchSessions error', err)
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
          set({
            messages: [...get().messages, ...newMessages],
            gameState: res.data.gameState,
            isLoading: false,
          })
          return true
        } catch (err: any) {
          set({ error: err.message || 'Failed to send message', isLoading: false })
          return false
        }
      },

      sendMessageStream: async (content: string, imageUrl?: string) => {
        const session = get().currentSession
        if (!session) return

        const tempUserId = `temp-user-${Date.now()}`
        const tempAiId = `temp-ai-${Date.now()}`

        const tempUserMessage: Message = {
          id: tempUserId,
          role: 'user',
          content: content || (imageUrl ? '[图片]' : ''),
          createdAt: new Date().toISOString(),
          messageType: imageUrl ? 'image' : 'text',
          imageUrl: imageUrl || undefined,
        }

        const tempAiMessage: Message = {
          id: tempAiId,
          role: 'assistant',
          content: '',
          createdAt: new Date().toISOString(),
        }

        set({
          messages: [...get().messages, tempUserMessage, tempAiMessage],
          isLoading: true,
        })

        try {
          await api.streamMessage(session.id, content, (chunk) => {
            const currentMessages = get().messages
            const aiIndex = currentMessages.findIndex(m => m.id === tempAiId)
            if (aiIndex >= 0) {
              const updated = [...currentMessages]
              updated[aiIndex] = { ...updated[aiIndex], content: chunk }
              set({ messages: updated })
            }
          }, imageUrl)

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

      sendImage: async (file: File) => {
        const session = get().currentSession
        if (!session) return false

        set({ isLoading: true, error: null })
        try {
          const uploadRes = await api.uploadFile(file, 'image')
          await get().sendMessageStream('', uploadRes.url)
          return true
        } catch (err: any) {
          set({ error: err.message || '发送图片失败', isLoading: false })
          return false
        }
      },

      sendVoice: async (blob: Blob, duration: number) => {
        const session = get().currentSession
        if (!session) return false

        set({ isLoading: true, error: null })
        try {
          const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type || 'audio/webm' })
          const uploadRes = await api.uploadFile(file, 'voice')

          const tempUserId = `temp-user-${Date.now()}`
          const tempAiId = `temp-ai-${Date.now()}`

          const tempUserMessage: Message = {
            id: tempUserId,
            role: 'user',
            content: `${duration}`,
            createdAt: new Date().toISOString(),
            messageType: 'voice',
            imageUrl: uploadRes.url,
          }

          const tempAiMessage: Message = {
            id: tempAiId,
            role: 'assistant',
            content: '',
            createdAt: new Date().toISOString(),
          }

          set({
            messages: [...get().messages, tempUserMessage, tempAiMessage],
            isLoading: true,
          })

          await api.streamMessage(session.id, `${duration}`, (chunk) => {
            const currentMessages = get().messages
            const aiIndex = currentMessages.findIndex(m => m.id === tempAiId)
            if (aiIndex >= 0) {
              const updated = [...currentMessages]
              updated[aiIndex] = { ...updated[aiIndex], content: chunk }
              set({ messages: updated })
            }
          }, uploadRes.url, 'voice')

          const res = await api.getSession(session.id)
          if (res.success) {
            set({
              currentSession: res.data,
              messages: res.data.messages || [],
              gameState: res.data.gameState,
              isLoading: false,
            })
          }
          return true
        } catch (err: any) {
          set({ error: err.message || '发送语音失败', isLoading: false })
          return false
        }
      },
    }),
    {
      name: 'game-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ currentSession: state.currentSession }),
      skipHydration: true,
    }
  )
)
