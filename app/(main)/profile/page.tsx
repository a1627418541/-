'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { User, Mail, LogOut, Crown, Calendar, XCircle } from 'lucide-react'

interface SubscriptionData {
  status: string
  plan: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

export default function ProfilePage() {
  const { user, logout } = useAuthStore()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetch('/api/billing/subscription')
        .then((res) => res.json())
        .then((data) => {
          if (data.subscription) {
            setSubscription(data.subscription)
          }
        })
    }
  }, [user])

  const handleCancel = async () => {
    if (!confirm('确定要取消订阅吗？取消后您仍可在当前计费周期内使用全部功能。')) return
    setLoading(true)
    try {
      const res = await fetch('/api/billing/subscription', { method: 'DELETE' })
      if (res.ok) {
        setSubscription((prev) => prev ? { ...prev, cancelAtPeriodEnd: true } : null)
      } else {
        alert('取消失败，请重试')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleManage = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setLoading(false)
    }
  }

  const isActive = subscription && (subscription.status === 'active' || subscription.status === 'trialing')

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
              <h2 className="text-xl font-semibold">{user?.name || '用户'}</h2>
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

        {/* Subscription Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold">会员状态</h3>
          </div>

          {isActive ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-400">
                    {subscription!.plan === 'yearly' ? '年度会员' : '月度会员'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    有效期至 {new Date(subscription!.currentPeriodEnd).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-full">
                  {subscription!.cancelAtPeriodEnd ? '到期不续费' : '活跃'}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleManage}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  管理订阅
                </button>
                {!subscription!.cancelAtPeriodEnd && (
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-sm transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    取消订阅
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400 mb-4">您当前不是会员，部分功能受限</p>
              <a
                href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-500 hover:bg-rose-600 rounded-xl text-sm font-medium transition-colors"
              >
                <Crown className="w-4 h-4" />
                升级会员
              </a>
            </div>
          )}
        </div>

        <button
          onClick={async () => { await logout() }}
          className="flex items-center gap-2 w-full px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  )
}
