import { useAuthStore } from '../stores/authStore'
import { User, Mail, LogOut } from 'lucide-react'

export default function ProfilePage() {
  const { user, logout } = useAuthStore()

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">个人资料</h1>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-rose-500/20 flex items-center justify-center">
              <User className="w-10 h-10 text-rose-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user?.nickname || '用户'}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                <Mail className="w-4 h-4" />
                <span>{user?.email || '未登录'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">用户ID</p>
              <p className="text-sm font-mono text-gray-300 truncate">{user?.id || '-'}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">注册邮箱</p>
              <p className="text-sm text-gray-300 truncate">{user?.email || '-'}</p>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  )
}
