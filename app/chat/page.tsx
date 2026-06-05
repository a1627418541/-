'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore, type Message } from '@/stores/game-store'
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

function getCharacterName(key: string): string {
  const map: Record<string, string> = {
    linxiaonuan: '林晓暖',
    guxingchen: '顾星辰',
    xiaxiaokui: '夏小葵',
    shenqiuqiu: '沈清秋',
  }
  return map[key] || '苏瞳'
}

// ─── Hooks ──────────────────────────────────────────────────────────

function useChatAuth() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => { const t = setTimeout(() => setIsReady(true), 400); return () => clearTimeout(t) }, [])
  useEffect(() => { if (isReady && !user) router.push('/login') }, [isReady, user, router])

  return { isReady, user }
}

function useChatSession(isReady: boolean, user: any, inputRef: React.RefObject<HTMLInputElement | null>) {
  const router = useRouter()
  const { currentSession, loadSession } = useGameStore()

  useEffect(() => {
    if (!isReady || !user) return
    if (!currentSession) {
      useGameStore.getState().fetchSessions().then(() => { if (!useGameStore.getState().currentSession) router.push('/') })
      return
    }
    loadSession(currentSession.id)
    inputRef.current?.focus()
  }, [isReady, user, currentSession?.id, router, loadSession, inputRef])

  return { currentSession }
}

function useAutoScroll(ref: React.RefObject<HTMLElement | null>, deps: React.DependencyList) {
  useEffect(() => { ref.current?.scrollIntoView({ behavior: 'smooth' }) }, deps)
}

function useEmojiPicker() {
  const [show, setShow] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const EmojiPickerComponent = dynamic(() => import('emoji-picker-react'), { ssr: false })

  useEffect(() => {
    if (!show) return
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setShow(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [show])

  return { show, setShow, ref, EmojiPickerComponent }
}

function useTextInput(inputRef: React.RefObject<HTMLInputElement | null>, sendMessageStream: (content: string) => Promise<void>) {
  const [input, setInput] = useState('')
  const { isLoading } = useGameStore()

  const handleSend = async () => {
    const content = input.trim()
    if (!content || isLoading) return
    setInput('')
    await sendMessageStream(content)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }

  return { input, setInput, handleSend, handleKeyDown }
}

function useImageUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await useGameStore.getState().sendImage(file)
    e.target.value = ''
  }

  return { fileInputRef, handleImageSelect }
}

function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [time, setTime] = useState(0)
  const recorder = useRef<MediaRecorder | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const chunks = useRef<Blob[]>([])

  const stop = () => {
    recorder.current?.stop()
    setIsRecording(false)
    if (timer.current) { clearInterval(timer.current); timer.current = null }
  }

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mt = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
    const mr = new MediaRecorder(stream, { mimeType: mt })
    chunks.current = []
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data) }
    mr.onstop = () => { useGameStore.getState().sendVoice(new Blob(chunks.current, { type: mt }), time); stream.getTracks().forEach((t) => t.stop()) }
    mr.start()
    recorder.current = mr
    setIsRecording(true)
    setTime(0)
    timer.current = setInterval(() => setTime((p) => p + 1), 1000)
  }

  const toggle = () => { isRecording ? stop() : start().catch(() => alert('无法访问麦克风，请检查权限设置')) }

  return { isRecording, time, toggle }
}

function useVoicePlayer() {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audio = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const a = new Audio()
    a.onended = () => setPlayingId(null)
    a.onpause = () => setPlayingId(null)
    audio.current = a
    return () => { a.pause() }
  }, [])

  const toggle = (id: string, url: string) => {
    if (playingId === id) { audio.current?.pause(); setPlayingId(null) }
    else { audio.current?.pause(); if (audio.current) { audio.current.src = url; audio.current.play().catch(() => {}); setPlayingId(id) } }
  }

  return { playingId, togglePlay: toggle }
}

// ─── Components ─────────────────────────────────────────────────────

function Avatar({ src, fallback, className = '' }: { src?: string; fallback: string; className?: string }) {
  const base = `w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 ${className}`
  if (src) {
    return <img src={src} alt="" className={`${base} object-cover`.trim()} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; e.currentTarget.parentElement!.innerHTML = `<div class="${base}">${fallback[0]}</div>` }} />
  }
  return <div className={base}>{fallback[0]}</div>
}

function MessageContent({ msg, playingId, onToggleVoice }: { msg: Message; playingId: string | null; onToggleVoice: (id: string, url: string) => void }) {
  const isUser = msg.role === 'user'
  const base = isUser ? 'bg-[#95ec69] rounded-2xl rounded-tr-sm' : 'bg-white rounded-2xl rounded-tl-sm shadow-sm'

  if (msg.messageType === 'voice' && msg.imageUrl) {
    return <button onClick={() => onToggleVoice(msg.id, msg.imageUrl!)} className={`flex items-center gap-2 px-4 py-2.5 ${base}`}>{playingId === msg.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}<span className="text-xs">{formatDuration(parseInt(msg.content) || 0)}</span></button>
  }
  if (msg.messageType === 'image' && msg.imageUrl) {
    return <div className="max-w-[60%] overflow-hidden rounded-2xl shadow-sm"><img src={msg.imageUrl} alt={msg.content} className="max-w-full max-h-96 rounded-2xl cursor-pointer hover:opacity-95 transition-opacity" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = '/avatars/placeholder.png' }} />{msg.content && msg.content !== '[图片]' && <p className="text-xs text-gray-400 mt-1 px-1">{msg.content}</p>}</div>
  }
  return <div className={`max-w-[70%] px-4 py-2.5 text-sm leading-relaxed ${base}`}>{msg.content}</div>
}

function MessageBubble({ msg, characterName, characterAvatar, playingId, onToggleVoice }: { msg: Message; characterName: string; characterAvatar?: string; playingId: string | null; onToggleVoice: (id: string, url: string) => void }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}>
      {!isUser && <Avatar src={characterAvatar} fallback={characterName} className="bg-rose-100 text-gray-900" />}
      <MessageContent msg={msg} playingId={playingId} onToggleVoice={onToggleVoice} />
      {isUser && <Avatar fallback="我" className="bg-blue-100 text-gray-900" />}
    </div>
  )
}

function ChatHeader({ name, isLoading, onBack }: { name: string; isLoading: boolean; onBack: () => void }) {
  return (
    <div className="flex items-center px-4 py-3 bg-[#ededed] border-b border-gray-300">
      <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft className="w-5 h-5 text-gray-700" /></button>
      <div className="flex-1 text-center">
        <h2 className="text-base font-medium text-gray-900">{name}</h2>
        {isLoading && <p className="text-xs text-gray-500 animate-pulse">正在输入中<span className="inline-block w-4 text-left">...</span></p>}
      </div>
      <div className="w-9" />
    </div>
  )
}

function MessageList({ messages, error, characterName, characterAvatar, playingId, onToggleVoice, endRef }: { messages: Message[]; error?: string | null; characterName: string; characterAvatar?: string; playingId: string | null; onToggleVoice: (id: string, url: string) => void; endRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {error && <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {messages.length === 0 && <div className="text-center py-12"><div className="text-4xl mb-4">💬</div><p className="text-gray-400 text-sm">发送第一条消息，开始你们的对话</p></div>}
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user'
        if (!isUser && !msg.content.trim() && msg.messageType !== 'image' && msg.messageType !== 'voice') return null
        const showTime = index === 0 || new Date(msg.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 5 * 60 * 1000
        return (
          <div key={msg.id}>
            {showTime && <div className="text-center my-4"><span className="text-xs text-gray-400 bg-gray-200/50 px-2 py-1 rounded">{formatTime(msg.createdAt)}</span></div>}
            <MessageBubble msg={msg} characterName={characterName} characterAvatar={characterAvatar} playingId={playingId} onToggleVoice={onToggleVoice} />
          </div>
        )
      })}
      <div ref={endRef} />
    </div>
  )
}

function RecordingOverlay({ isRecording, recordingTime }: { isRecording: boolean; recordingTime: number }) {
  if (!isRecording) return null
  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-t-lg">
      <div className="bg-white rounded-2xl px-6 py-4 flex flex-col items-center gap-2">
        <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse"><Mic className="w-6 h-6 text-white" /></div>
        <p className="text-sm font-medium text-gray-900">正在录音... {formatDuration(recordingTime)}</p>
        <p className="text-xs text-gray-500">点击麦克风按钮停止</p>
      </div>
    </div>
  )
}

interface ChatInputBarProps {
  input: string; setInput: (v: string) => void; inputRef: React.RefObject<HTMLInputElement | null>
  handleSend: () => void; handleKeyDown: (e: React.KeyboardEvent) => void
  showEmoji: boolean; setShowEmoji: (v: boolean) => void; emojiRef: React.RefObject<HTMLDivElement | null>
  EmojiPickerComponent: any; handleEmojiClick: (data: EmojiClickData) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>; handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  isRecording: boolean; toggleRecording: () => void; isLoading: boolean
}

function ChatInputBar(p: ChatInputBarProps) {
  return (
    <div className="px-4 py-3 bg-[#f7f7f7] border-t border-gray-200 relative">
      <div className="flex items-center gap-2">
        <button onClick={() => p.setShowEmoji(!p.showEmoji)} className="p-2.5 text-gray-500 hover:text-rose-500 hover:bg-gray-200 rounded-full transition-colors shrink-0" type="button"><Smile className="w-5 h-5" /></button>
        <button onClick={() => p.fileInputRef.current?.click()} disabled={p.isLoading || p.isRecording} className="p-2.5 text-gray-500 hover:text-rose-500 hover:bg-gray-200 rounded-full transition-colors shrink-0 disabled:opacity-50" type="button"><ImagePlus className="w-5 h-5" /></button>
        <input ref={p.fileInputRef} type="file" accept="image/*" onChange={p.handleImageSelect} className="hidden" />
        <button onClick={p.toggleRecording} disabled={p.isLoading} className={`p-2.5 rounded-full transition-colors shrink-0 disabled:opacity-50 ${p.isRecording ? 'bg-red-500 text-white hover:bg-red-600' : 'text-gray-500 hover:text-rose-500 hover:bg-gray-200'}`} type="button"><Mic className="w-5 h-5" /></button>
        <input ref={p.inputRef} type="text" value={p.input} onChange={(e) => p.setInput(e.target.value)} onKeyDown={p.handleKeyDown} placeholder={p.isRecording ? '录音中...' : '说点什么...'} disabled={p.isRecording} autoFocus className="flex-1 px-4 py-2.5 bg-white rounded-full text-sm text-gray-900 border border-gray-200 focus:outline-none focus:border-rose-400 disabled:bg-gray-100" />
        <button onClick={p.handleSend} disabled={!p.input.trim() || p.isLoading || p.isRecording} className="p-2.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 disabled:opacity-50 disabled:hover:bg-rose-500 transition-colors shrink-0"><Send className="w-4 h-4" /></button>
      </div>
      {p.showEmoji && <div ref={p.emojiRef} className="absolute bottom-full left-4 mb-2 z-50"><p.EmojiPickerComponent onEmojiClick={p.handleEmojiClick} /></div>}
    </div>
  )
}

function LoadingScreen({ error }: { error?: string | null }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100 px-4 text-center">
      <div className="text-gray-500 mb-3">加载中...</div>
      {error && <div className="max-w-md text-sm text-red-700 bg-red-100 border border-red-200 rounded-xl p-4">{error}</div>}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────

export default function ChatPage() {
  const router = useRouter()
  const { isReady, user } = useChatAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const { currentSession } = useChatSession(isReady, user, inputRef)
  const { characters, messages, gameState, isLoading, error } = useGameStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  useAutoScroll(messagesEndRef, [messages])

  const { input, setInput, handleSend, handleKeyDown } = useTextInput(inputRef, useGameStore.getState().sendMessageStream)
  const { show: showEmoji, setShow: setShowEmoji, ref: emojiRef, EmojiPickerComponent } = useEmojiPicker()
  const { fileInputRef, handleImageSelect } = useImageUpload()
  const { isRecording, time: recordingTime, toggle: toggleRecording } = useVoiceRecorder()
  const { playingId: playingVoiceId, togglePlay: togglePlayVoice } = useVoicePlayer()

  const currentCharacter = characters.find((c) => c.key === currentSession?.characterKey)
  const characterName = currentCharacter?.name || getCharacterName(currentSession?.characterKey || '')
  const characterAvatar = currentCharacter?.avatar

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setInput((prev) => prev + emojiData.emoji)
    inputRef.current?.focus()
  }

  if (!currentSession || !gameState) return <LoadingScreen error={error} />

  return (
    <div className="h-screen flex flex-col bg-[#f5f5f5]">
      <ChatHeader name={characterName} isLoading={isLoading} onBack={() => router.push('/')} />
      <MessageList messages={messages} error={error} characterName={characterName} characterAvatar={characterAvatar} playingId={playingVoiceId} onToggleVoice={togglePlayVoice} endRef={messagesEndRef} />
      <RecordingOverlay isRecording={isRecording} recordingTime={recordingTime} />
      <ChatInputBar input={input} setInput={setInput} inputRef={inputRef} handleSend={handleSend} handleKeyDown={handleKeyDown} showEmoji={showEmoji} setShowEmoji={setShowEmoji} emojiRef={emojiRef} EmojiPickerComponent={EmojiPickerComponent} handleEmojiClick={handleEmojiClick} fileInputRef={fileInputRef} handleImageSelect={handleImageSelect} isRecording={isRecording} toggleRecording={toggleRecording} isLoading={isLoading} />
    </div>
  )
}
