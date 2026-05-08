import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useLocation } from 'react-router-dom'

export default function Layout() {
  const location = useLocation()
  const isChatPage = location.pathname === '/chat'

  // Chat page is full screen without sidebar
  if (isChatPage) {
    return <Outlet />
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <main className="flex-1 ml-16 lg:ml-56">
        <Outlet />
      </main>
    </div>
  )
}
