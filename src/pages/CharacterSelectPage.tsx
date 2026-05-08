import { useEffect, useState } from 'react'
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

const cardColors: Record<string, string> = {
  linxiaonuan: 'from-amber-50 to-orange-100 border-orange-200',
  guxingchen: 'from-purple-50 to-violet-100 border-violet-200',
  xiaxiaokui: 'from-sky-50 to-blue-100 border-blue-200',
  shenqiuqiu: 'from-slate-50 to-gray-100 border-gray-200',
  sutong: 'from-rose-50 to-pink-100 border-pink-200',
}

export default function CharacterSelectPage() {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const { characters, currentSession, fetchCharacters, createSession, gameState } = useGameStore()
  const [isPaused, setIsPaused] = useState(false)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

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

  // Duplicate characters for seamless infinite scroll
  const duplicatedChars = characters.length > 0
    ? [...characters, ...characters, ...characters, ...characters]
    : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 overflow-hidden">
      {/* Inline styles for marquee animation */}
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee-scroll 40s linear infinite;
          width: max-content;
        }
        .marquee-track.paused {
          animation-play-state: paused;
        }
        .char-card {
          transition: filter 0.4s ease, transform 0.4s ease, box-shadow 0.4s ease;
        }
        .char-card.dimmed {
          filter: brightness(0.6);
        }
        .char-card.bright {
          filter: brightness(1.2);
          transform: scale(1.06);
          z-index: 10;
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center pt-12 pb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3 tracking-tight">选择你的她</h1>
          <p className="text-gray-500 text-lg">每个人的故事都独一无二，你想从哪里开始？</p>
        </div>

        {/* Continue session banner */}
        {currentSession && gameState && (
          <div className="mb-10 max-w-lg mx-auto p-5 bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">继续上次的旅程</p>
                <p className="text-lg font-semibold text-gray-700">
                  与 {currentSession.characterKey === 'linxiaonuan' ? '林晓暖'
                    : currentSession.characterKey === 'guxingchen' ? '顾星辰'
                    : currentSession.characterKey === 'xiaxiaokui' ? '夏小葵'
                    : currentSession.characterKey === 'shenqiuqiu' ? '沈清秋'
                    : '苏瞳'} 的关系：{stageLabels[gameState.relationshipStage]}
                </p>
              </div>
              <button
                onClick={() => navigate('/chat')}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors shadow-md hover:shadow-lg"
              >
                继续 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Scrolling Carousel */}
        <div
          className="relative py-8"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => { setIsPaused(false); setHoveredKey(null) }}
        >
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-rose-50 to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-pink-100 to-transparent z-20 pointer-events-none" />

          <div className={`marquee-track ${isPaused ? 'paused' : ''} flex gap-6`}>
            {duplicatedChars.map((char, index) => {
              const uniqueKey = `${char.key}-${index}`
              const isHovered = hoveredKey === uniqueKey
              const hasHover = hoveredKey !== null
              return (
                <button
                  key={uniqueKey}
                  onClick={() => handleSelect(char.key)}
                  onMouseEnter={() => setHoveredKey(uniqueKey)}
                  onMouseLeave={() => setHoveredKey(null)}
                  className={`
                    char-card flex-shrink-0 w-72 p-6 bg-gradient-to-br ${cardColors[char.key] || 'from-gray-50 to-gray-100 border-gray-200'}
                    border-2 rounded-2xl text-left shadow-md hover:shadow-xl
                    ${isHovered ? 'bright' : ''}
                    ${hasHover && !isHovered ? 'dimmed' : ''}
                  `}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={char.avatar}
                      alt={char.name}
                      className="w-16 h-16 rounded-full bg-white shadow-sm object-cover"
                    />
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{char.name}</h3>
                      <span className="inline-block px-2.5 py-0.5 text-xs bg-white/80 rounded-full text-gray-600 mt-1">
                        {char.title}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">{char.bio}</p>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <span className="font-medium">{char.age}岁</span>
                    <span className="text-gray-300">·</span>
                    <span className="truncate">{char.occupation}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-rose-500 text-sm font-medium">
                    <Heart className="w-4 h-4 fill-rose-100" />
                    <span>开始故事</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Bottom hint */}
        <div className="text-center pb-12 pt-4">
          <p className="text-sm text-gray-400">悬停卡片查看详情，点击开启故事</p>
        </div>
      </div>
    </div>
  )
}
