'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Image, User, MessageCircle, LogOut, Heart } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

const navItems = [
  { path: '/', icon: Compass, label: '探索' },
  { path: '/ai-art', icon: Image, label: 'AI艺术' },
  { path: '/profile', icon: User, label: '个人资料' },
  { path: '/chat', icon: MessageCircle, label: '对话' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const pathname = usePathname()
  const isChatPage = pathname === '/chat'

  if (isChatPage) return null

  return (
    <aside className="w-16 lg:w-56 h-screen bg-[#0a0a0f] border-r border-white/5 flex flex-col shrink-0 fixed left-0 top-0 z-50">
      <div className="h-16 flex items-center px-4 lg:px-5 border-b border-white/5">
        <Heart className="w-6 h-6 text-rose-500 shrink-0" />
        <span className="ml-3 text-lg font-bold text-white hidden lg:block tracking-tight">
          恋爱模拟器
        </span>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isActive
                  ? 'bg-rose-500/10 text-rose-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="hidden lg:block text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/5">
        {user && (
          <div className="mb-2 px-3 py-2 hidden lg:block">
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="hidden lg:block text-sm font-medium">退出登录</span>
        </button>
      </div>
    </aside>
  )
}
