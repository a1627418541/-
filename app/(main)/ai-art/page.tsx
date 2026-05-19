import { Image, Sparkles } from 'lucide-react'

export default function AIArtPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Sparkles className="w-6 h-6 text-rose-400" />
          <h1 className="text-2xl font-bold">AI 艺术</h1>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center">
            <Image className="w-10 h-10 text-gray-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">功能开发中</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            AI 艺术功能即将上线，届时你可以使用 AI 生成专属的角色插画和场景图片。
          </p>
        </div>
      </div>
    </div>
  )
}
