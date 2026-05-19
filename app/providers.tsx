'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useGameStore } from '@/stores/game-store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useAuthStore.persist.rehydrate()
    useGameStore.persist.rehydrate()
    const token = useAuthStore.getState().token
    if (token) {
      useAuthStore.getState().init()
    }
  }, [])

  return <>{children}</>
}
