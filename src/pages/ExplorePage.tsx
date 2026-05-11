import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../stores/gameStore'
import { useAuthStore } from '../stores/authStore'
import { Search, MessageSquare, Heart, Flame } from 'lucide-react'

const tags = [
  { key: 'all', label: '全部' },
  { key: 'hot', label: '热门', badge: '最新' },
  { key: 'female', label: '女性' },
  { key: 'male', label: '男性' },
  { key: 'more', label: '更多标签' },
]

const tagColors: Record<string, string> = {
  linxiaonuan: 'from-amber-500/20 to-orange-500/20',
  guxingchen: 'from-purple-500/20 to-violet-500/20',
  xiaxiaokui: 'from-sky-500/20 to-blue-500/20',
  shenqiuqiu: 'from-slate-500/20 to-gray-500/20',
  sutong: 'from-rose-500/20 to-pink-500/20',
}

export default function ExplorePage() {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const { characters, currentSession, gameState, sessions, fetchCharacters, createSession, fetchSessions } = useGameStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTag, setActiveTag] = useState('all')
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    fetchCharacters()
    fetchSessions()
  }, [token, navigate, fetchCharacters, fetchSessions])

  const handleSelect = async (key: string) => {
    const success = await createSession(key)
    if (success) {
      navigate('/chat')
    }
  }

  const filteredChars = characters.filter((char) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        char.name.toLowerCase().includes(q) ||
        char.title.toLowerCase().includes(q) ||
        char.bio.toLowerCase().includes(q)
      )
    }
    return true
  })

  const stageLabels: Record<string, string> = {
    stranger: '初识',
    acquaintance: '相识',
    friend: '朋友',
    close: '亲密',
    lover: '恋人',
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-4 max-w-6xl mx-auto">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="寻找你的角色..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50 focus:bg-white/10 transition-colors"
            />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Creator toggle placeholder */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>创作者</span>
            <div className="w-10 h-5 bg-gray-700 rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-gray-400 rounded-full absolute top-0.5 left-0.5" />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2 mt-4 max-w-6xl mx-auto overflow-x-auto pb-1 scrollbar-hide">
          {tags.map((tag) => (
            <button
              key={tag.key}
              onClick={() => setActiveTag(tag.key)}
              className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTag === tag.key
                  ? 'bg-rose-500 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              {tag.label}
              {tag.badge && (
                <span className="absolute -top-1.5 -right-1 px-1.5 py-0.5 bg-rose-500 text-white text-[10px] rounded-full">
                  {tag.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Warning text */}
      <div className="text-center py-3 text-xs text-gray-500">
        *平台严禁未成年或深度伪造内容
      </div>

      {/* Continue Session Banner */}
      {currentSession && gameState && (
        <div className="px-6 mb-6 max-w-6xl mx-auto">
          <div
            onClick={() => navigate('/chat')}
            className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-rose-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-400">继续上次的旅程</p>
              <p className="text-white font-medium">
                与 {characters.find(c => c.key === currentSession.characterKey)?.name || currentSession.characterKey} · {stageLabels[gameState.relationshipStage]}
              </p>
            </div>
            <div className="px-4 py-2 bg-rose-500 text-white text-sm rounded-xl hover:bg-rose-600 transition-colors">
              继续
            </div>
          </div>
        </div>
      )}

      {/* Character Grid */}
      <div className="px-6 pb-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredChars.map((char) => {
            const isHovered = hoveredKey === char.key
            const sessionCount = sessions?.filter((s: any) => s.characterKey === char.key).length || 0
            const messageCount = sessions
              ?.filter((s: any) => s.characterKey === char.key)
              .reduce((sum: number, s: any) => sum + (s._count?.messages || 0), 0) || 0

            return (
              <div
                key={char.key}
                onClick={() => handleSelect(char.key)}
                onMouseEnter={() => setHoveredKey(char.key)}
                onMouseLeave={() => setHoveredKey(null)}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer bg-gray-800"
              >
                {/* Background Image */}
                <img
                  src={char.coverImage}
                  alt={char.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />

                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-80'}`} />

                {/* Top badges */}
                <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full bg-gradient-to-r ${tagColors[char.key] || 'from-gray-500/20 to-gray-500/20'} text-white/90 backdrop-blur-sm border border-white/10`}>
                    {char.title}
                  </span>
                  {isHovered && (
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-rose-500/80 text-white backdrop-blur-sm">
                      无限制
                    </span>
                  )}
                </div>

                {/* Bottom Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-lg font-bold text-white mb-1">{char.name}</h3>
                  <p className="text-xs text-gray-300 line-clamp-2 mb-2 leading-relaxed">
                    {char.bio}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {messageCount > 0 ? `${messageCount}` : '0'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {sessionCount > 0 ? `${sessionCount}` : '0'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      {char.age}岁
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
