'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { Check, Sparkles, Zap } from 'lucide-react'

const plans = [
  {
    key: 'monthly',
    name: '月度会员',
    price: '¥29',
    period: '/月',
    description: '按月订阅，随时取消',
    features: [
      '无限聊天次数',
      '解锁所有角色',
      '优先 AI 响应',
      '高清图片生成',
      '专属客服支持',
    ],
    icon: Zap,
    popular: false,
  },
  {
    key: 'yearly',
    name: '年度会员',
    price: '¥199',
    period: '/年',
    description: '年付立省 ¥149',
    features: [
      '无限聊天次数',
      '解锁所有角色',
      '优先 AI 响应',
      '高清图片生成',
      '专属客服支持',
      '新角色优先体验',
      '专属年度徽章',
    ],
    icon: Sparkles,
    popular: true,
  },
]

export default function PricingPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    if (!user) {
      router.push('/login?from=/pricing')
      return
    }

    setLoading(plan)
    try {
      const res = await fetch('/api/billing/creem-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || '创建订单失败')
      }
    } catch (err) {
      alert('网络错误，请重试')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="text-center px-6 pt-16 pb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">升级你的恋爱体验</h1>
        <p className="text-gray-400 max-w-md mx-auto">
          解锁无限对话、全部角色和高级功能，开启专属于你的沉浸式恋爱旅程
        </p>
      </div>

      {/* Plans */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-2xl p-6 ${
                plan.popular
                  ? 'bg-gradient-to-b from-rose-500/10 to-transparent border-2 border-rose-500/30'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-rose-500 text-white text-xs font-medium rounded-full">
                  最受欢迎
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  plan.popular ? 'bg-rose-500/20' : 'bg-white/10'
                }`}>
                  <plan.icon className={`w-5 h-5 ${plan.popular ? 'text-rose-400' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="font-semibold">{plan.name}</h3>
                  <p className="text-xs text-gray-500">{plan.description}</p>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-400">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-rose-400 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.key as 'monthly' | 'yearly')}
                disabled={loading === plan.key}
                className={`w-full py-3 rounded-xl font-medium transition-colors ${
                  plan.popular
                    ? 'bg-rose-500 hover:bg-rose-600 text-white disabled:bg-rose-500/50'
                    : 'bg-white/10 hover:bg-white/20 text-white disabled:bg-white/5'
                }`}
              >
                {loading === plan.key ? '处理中...' : '立即订阅'}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ / Note */}
        <div className="mt-12 text-center text-xs text-gray-500 space-y-2">
          <p>订阅可随时取消，取消后仍可在当前计费周期内使用全部功能</p>
          <p>支付由 Creem 安全处理，我们不会保存您的支付信息</p>
        </div>
      </div>
    </div>
  )
}
