import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../stores/gameStore'
import { useAuthStore } from '../stores/authStore'
import { Heart, ArrowRight } from 'lucide-react'

const stageLabels: Record<string, string> = {
  stranger: '初识',
  acquaintance: '相识',
  friend: '朋友',
  close: '亲密',
  lover: '恋人',
}

// Mood indicators (reserved for future use)
// const moodEmojis: Record<string, string> = {
//   happy: '😊', sad: '😢', angry: '😠', neutral: '😐', excited: '🤩',
// }

export default function CharacterSelectPage() {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const { characters, currentSession, fetchCharacters, createSession, gameState } = useGameStore()

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    fetchCharacters()
  }, [token, navigate])

  const handleSelect = async (key: string) => {
    const success = await createSession(key)
    if (success) {
      navigate('/chat')
    }
  }

  const getCardColor = (title: string) => {
    if (title.includes('治愈')) return 'from-amber-50 to-orange-100 border-orange-200'
    if (title.includes('傲娇')) return 'from-purple-50 to-violet-100 border-violet-200'
    if (title.includes('元气')) return 'from-sky-50 to-blue-100 border-blue-200'
    if (title.includes('文艺')) return 'from-slate-50 to-gray-100 border-gray-200'
    if (title.includes('神秘')) return 'from-rose-50 to-pink-100 border-pink-200'
    return 'from-gray-50 to-gray-100 border-gray-200'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">选择你的她</h1>
          <p className="text-gray-500">每个人的故事都独一无二，你想从哪里开始？</p>
        </div>

        {currentSession && gameState && (
          <div className="mb-8 p-4 bg-white rounded-2xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">继续上次的旅程</p>
                <p className="text-lg font-medium">
                  与 {currentSession.characterKey} 的关系：{stageLabels[gameState.relationshipStage]}
                </p>
              </div>
              <button
                onClick={() => navigate('/chat')}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors"
              >
                继续 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((char) => (
            <button
              key={char.key}
              onClick={() => handleSelect(char.key)}
              className={`group text-left p-6 bg-gradient-to-br ${getCardColor(char.title)} border-2 rounded-2xl hover:shadow-lg transition-all hover:-translate-y-1`}
            >
              <div className="flex items-start gap-4 mb-4">
                <img
                  src={char.avatar}
                  alt={char.name}
                  className="w-16 h-16 rounded-full bg-white shadow-sm"
                />
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{char.name}</h3>
                  <span className="inline-block px-2 py-1 text-xs bg-white/70 rounded-full text-gray-600">
                    {char.title}
                  </span>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{char.bio}</p>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{char.age}岁</span>
                <span>·</span>
                <span>{char.occupation}</span>
              </div>

              <div className="mt-4 flex items-center gap-1 text-rose-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <Heart className="w-4 h-4" />
                <span>开始故事</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
