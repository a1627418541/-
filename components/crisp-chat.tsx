'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

declare global {
  interface Window {
    $crisp: string[][]
    CRISP_WEBSITE_ID: string
  }
}

const CRISP_WEBSITE_ID = 'd8e9b1cb-854e-4880-ab82-33e0ac5a358f'

function setCrispVisibility(show: boolean) {
  if (!window.$crisp) return
  window.$crisp.push(['do', show ? 'chat:show' : 'chat:hide'])
}

export default function CrispChat() {
  const pathname = usePathname()
  const scriptLoaded = useRef(false)

  useEffect(() => {
    const isHomePage = pathname === '/'

    if (isHomePage && !scriptLoaded.current) {
      window.$crisp = []
      window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID

      const script = document.createElement('script')
      script.src = 'https://client.crisp.chat/l.js'
      script.async = true
      script.id = 'crisp-chat-script'

      script.onload = () => {
        setCrispVisibility(true)
      }

      document.head.appendChild(script)
      scriptLoaded.current = true
      return
    }

    setCrispVisibility(isHomePage)
  }, [pathname])

  return null
}
