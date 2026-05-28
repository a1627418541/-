'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/stores/game-store'
import { useAuthStore } from '@/stores/auth-store'
import { ArrowLeft, Send, Smile, ImagePlus, Mic, Play, Pause } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { EmojiClickData } from 'emoji-picker-react'

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}"`
}

export default function ChatPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const {
    currentSession,
    characters,
    messages,
    gameState,
    isLoading,
    error,
    loadSession,
    sendMessageStream,
  } = useGameStore()

  const [input, setInput] = useState('')
  const [isReady, setIsReady] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

  // Image upload
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Voice recording
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const voiceChunksRef = useRef<Blob[]>([])

  // Voice playback
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 400)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isReady) return
    if (!user) {
      router.push('/login')
      return
    }
  }, [isReady, user, router])

  useEffect(() => {
    if (!isReady || !user) return
    if (!currentSession) {
      useGameStore.getState().fetchSessions().then(() => {
        if (!useGameStore.getState().currentSession) {
          router.push('/')
        }
      })
      return
    }

    loadSession(currentSession.id)
    inputRef.current?.focus()
  }, [isReady, user, currentSession?.id, router, loadSession])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Click outside to close emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  // Init audio element for voice playback
  useEffect(() => {
    const audio = new Audio()
    audio.onended = () => setPlayingVoiceId(null)
    audio.onpause = () => setPlayingVoiceId(null)
    audioRef.current = audio
    return () => { audio.pause() }
  }, [])

  const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false })

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setInput((prev) => prev + emojiData.emoji)
    inputRef.current?.focus()
  }

  const handleSend = async () => {
    const content = input.trim()
    if (!content || isLoading) return
    setInput('')
    await sendMessageStream(content)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Image upload
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await useGameStore.getState().sendImage(file)
    e.target.value = ''
  }

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : undefined

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      voiceChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) voiceChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(voiceChunksRef.current, { type: mimeType || 'audio/webm' })
        const duration = recordingTime
        useGameStore.getState().sendVoice(blob, duration)
        stream.getTracks().forEach((t) => t.stop())
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      setRecordingTime(0)

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch {
      alert('无法访问麦克风，请检查权限设置')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Voice playback
  const togglePlayVoice = (msgId: string, url: string) => {
    if (playingVoiceId === msgId) {
      audioRef.current?.pause()
      setPlayingVoiceId(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = url
        audioRef.current.play().catch(() => {})
        setPlayingVoiceId(msgId)
      }
    }
  }

  if (!currentSession || !gameState) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-100 px-4 text-center">
        <div className="text-gray-500 mb-3">加载中...</div>
        {error && (
          <div className="max-w-md text-sm text-red-700 bg-red-100 border border-red-200 rounded-xl p-4">
            {error}
          </div>
        )}
      </div>
    )
  }

  const currentCharacter = characters.find((c) => c.key === currentSession.characterKey)
  const characterName =
    currentCharacter?.name ||
    (currentSession.characterKey === 'linxiaonuan'
      ? '林晓暖'
      : currentSession.characterKey === 'guxingchen'
        ? '顾星辰'
        : currentSession.characterKey === 'xiaxiaokui'
          ? '夏小葵'
          : currentSession.characterKey === 'shenqiuqiu'
            ? '沈清秋'
            : '苏瞳')
  const characterAvatar = currentCharacter?.avatar

  return (
    <div className="h-screen flex flex-col bg-[#f5f5f5]">
      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-[#ededed] border-b border-gray-300">
        <button
          onClick={() => router.push('/')}
          className="p-2 -ml-2 hover:bg-gray-200 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        <div className="flex-1 text-center">
          <h2 className="text-base font-medium text-gray-900">{characterName}</h2>
          {isLoading && (
            <p className="text-xs text-gray-500 animate-pulse">
              正在输入中<span className="inline-block w-4 text-left">...</span>
            </p>
          )}
        </div>

        <div className="w-9" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {error && (
          <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">💬</div>
            <p className="text-gray-400 text-sm">发送第一条消息，开始你们的对话</p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isUser = msg.role === 'user'
          if (!isUser && !msg.content.trim() && msg.messageType !== 'image' && msg.messageType !== 'voice')
            return null

          const showTime =
            index === 0 ||
            new Date(msg.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 5 * 60 * 1000

          return (
            <div key={msg.id}>
              {showTime && (
                <div className="text-center my-4">
                  <span className="text-xs text-gray-400 bg-gray-200/50 px-2 py-1 rounded">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              )}

              <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}>
                {!isUser &&
                  (characterAvatar ? (
                    <img
                      src={characterAvatar}
                      alt={characterName}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                        e.currentTarget.parentElement!.innerHTML = `<div class="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-sm">${characterName[0]}</div>`
                      }}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-sm text-gray-900 shrink-0">
                      {characterName[0]}
                    </div>
                  ))}

                {msg.messageType === 'voice' && msg.imageUrl ? (
                  <button
                    onClick={() => togglePlayVoice(msg.id, msg.imageUrl!)}
                    className={`flex items-center gap-2 px-4 py-2.5 ${
                      isUser
                        ? 'bg-[#95ec69] text-gray-900 rounded-2xl rounded-tr-sm'
                        : 'bg-white text-gray-900 rounded-2xl rounded-tl-sm shadow-sm'
                    }`}
                  >
                    {playingVoiceId === msg.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span className="text-xs">{formatDuration(parseInt(msg.content) || 0)}</span>
                  </button>
                ) : msg.messageType === 'image' && msg.imageUrl ? (
                  <div className="max-w-[60%] overflow-hidden rounded-2xl shadow-sm">
                    <img
                      src={msg.imageUrl}
                      alt={msg.content}
                      className="max-w-full max-h-96 rounded-2xl cursor-pointer hover:opacity-95 transition-opacity"
                      loading="lazy"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = '/avatars/placeholder.png'
                      }}
                    />
                    {msg.content && msg.content !== '[图片]' && (
                      <p className="text-xs text-gray-400 mt-1 px-1">{msg.content}</p>
                    )}
                  </div>
                ) : (
                  <div
                    className={`max-w-[70%] px-4 py-2.5 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#95ec69] text-gray-900 rounded-2xl rounded-tr-sm'
                        : 'bg-white text-gray-900 rounded-2xl rounded-tl-sm shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                )}

                {isUser && (
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm text-gray-900 shrink-0">
                    我
                  </div>
                )}
              </div>
            </div>
          )
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 bg-[#f7f7f7] border-t border-gray-200 relative">
        {/* Recording overlay */}
        {isRecording && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-t-lg">
            <div className="bg-white rounded-2xl px-6 py-4 flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-900">正在录音... {formatDuration(recordingTime)}</p>
              <p className="text-xs text-gray-500">点击麦克风按钮停止</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2.5 text-gray-500 hover:text-rose-500 hover:bg-gray-200 rounded-full transition-colors shrink-0"
            type="button"
          >
            <Smile className="w-5 h-5" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isRecording}
            className="p-2.5 text-gray-500 hover:text-rose-500 hover:bg-gray-200 rounded-full transition-colors shrink-0 disabled:opacity-50"
            type="button"
          >
            <ImagePlus className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          <button
            onClick={toggleRecording}
            disabled={isLoading}
            className={`p-2.5 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
              isRecording
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'text-gray-500 hover:text-rose-500 hover:bg-gray-200'
            }`}
            type="button"
          >
            <Mic className="w-5 h-5" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? '录音中...' : '说点什么...'}
            disabled={isRecording}
            autoFocus
            className="flex-1 px-4 py-2.5 bg-white rounded-full text-sm text-gray-900 border border-gray-200 focus:outline-none focus:border-rose-400 disabled:bg-gray-100"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isRecording}
            className="p-2.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 disabled:opacity-50 disabled:hover:bg-rose-500 transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute bottom-full left-4 mb-2 z-50">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </div>
    </div>
  )
}
