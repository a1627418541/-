import type { Metadata } from 'next'
import './globals.css'
import CrispChat from '@/components/crisp-chat'
import { AuthProvider } from './providers'

export const metadata: Metadata = {
  title: '恋爱模拟器',
  description: 'AI驱动的沉浸式恋爱模拟体验',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <AuthProvider>
          <CrispChat />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
