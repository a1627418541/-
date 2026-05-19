'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: object) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

interface TurnstileProps {
  onVerify: (token: string) => void
}

export default function Turnstile({ onVerify }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const onVerifyRef = useRef(onVerify)
  const completedRef = useRef(false)

  onVerifyRef.current = onVerify

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    if (!siteKey) {
      console.warn('[Turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY not set, skipping')
      onVerifyRef.current('__disabled__')
      return
    }

    // 5秒超时兜底：如果Turnstile一直没响应，自动跳过
    const timeoutId = setTimeout(() => {
      if (!completedRef.current) {
        console.warn('[Turnstile] Timeout, skipping verification')
        completedRef.current = true
        onVerifyRef.current('__disabled__')
      }
    }, 5000)

    const existingScript = document.querySelector(
      'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]'
    )

    const handleComplete = (token: string) => {
      if (!completedRef.current) {
        completedRef.current = true
        clearTimeout(timeoutId)
        onVerifyRef.current(token)
      }
    }

    const render = () => {
      if (!window.turnstile || !containerRef.current) return
      if (widgetIdRef.current) return

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'dark',
        callback: (token: string) => handleComplete(token),
        'error-callback': () => {
          console.warn('[Turnstile] Widget error, skipping verification')
          handleComplete('__disabled__')
        },
        'expired-callback': () => {
          window.turnstile?.reset(widgetIdRef.current!)
        },
      })
    }

    if (existingScript) {
      render()
    } else {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      script.defer = true
      script.onload = render
      script.onerror = () => {
        console.warn('[Turnstile] Script failed to load, skipping verification')
        handleComplete('__disabled__')
      }
      document.body.appendChild(script)
    }

    return () => {
      clearTimeout(timeoutId)
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} className="flex justify-center" />
}
