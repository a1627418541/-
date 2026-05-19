'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useGameStore } from '@/stores/game-store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useGameStore.persist.rehydrate()
    useAuthStore.getState().init()
  }, [])

  return <>{children}</>
}
