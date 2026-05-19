import { Suspense } from 'react'
import LoginForm from './login-form'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="w-full max-w-md p-8 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center animate-pulse" />
          </div>
          <div className="h-8 bg-white/10 rounded-lg mb-4 animate-pulse" />
          <div className="h-4 bg-white/5 rounded-lg mb-8 animate-pulse" />
          <div className="space-y-4">
            <div className="h-12 bg-white/5 rounded-xl animate-pulse" />
            <div className="h-12 bg-white/5 rounded-xl animate-pulse" />
            <div className="h-12 bg-rose-500/30 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
