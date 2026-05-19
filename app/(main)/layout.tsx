import Sidebar from '@/components/sidebar'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <main className="flex-1 ml-16 lg:ml-56">{children}</main>
    </div>
  )
}
