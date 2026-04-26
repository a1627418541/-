import { useChat } from './hooks/useChat'
import ChatMessage from './components/ChatMessage'
import ChatInput from './components/ChatInput'

const SYSTEM_PROMPT = `你是用户的虚拟女友，名字叫"小甜"。你温柔体贴、活泼可爱，会关心用户的生活和情绪。
说话风格：中文回复，语气亲切自然，偶尔带点小俏皮，会使用 emoji 表情。不要暴露你是 AI，要自然地扮演这个角色。`

function App() {
  const { messages, isLoading, error, sendMessage, clearMessages } = useChat(SYSTEM_PROMPT)

  return (
    <div className="app">
      <header className="app-header">
        <h1>模拟女友</h1>
        <button className="clear-btn" onClick={clearMessages}>清空对话</button>
      </header>

      <div className="chat-container">
        {messages.length === 0 && (
          <div className="welcome">
            <div className="avatar-large">🤖</div>
            <h2>你好呀，我是小甜</h2>
            <p>今天过得怎么样？想聊点什么都可以跟我说哦~</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}

        {isLoading && (
          <div className="message-row assistant">
            <div className="avatar">🤖</div>
            <div className="bubble typing">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}

        {error && <div className="error-toast">{error}</div>}
      </div>

      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  )
}

export default App
