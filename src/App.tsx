import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import ExplorePage from './pages/ExplorePage'
import ChatPage from './pages/ChatPage'
import ProfilePage from './pages/ProfilePage'
import AIArtPage from './pages/AIArtPage'
import TestTurnstilePage from './pages/TestTurnstilePage'

function App() {
  const { init } = useAuthStore()

  useEffect(() => {
    init()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/test-turnstile" element={<TestTurnstilePage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<ExplorePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/ai-art" element={<AIArtPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
