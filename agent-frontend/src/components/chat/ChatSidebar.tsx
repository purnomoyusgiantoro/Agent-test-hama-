import { Menu, Plus, Leaf, MessageSquare } from 'lucide-react'
import type { SessionInfo } from '../../hooks/useChatSession'

interface ChatSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
  sessionId: string;
  savedSessions: SessionInfo[];
  onNewChat: () => void;
}

export default function ChatSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  sessionId,
  savedSessions,
  onNewChat
}: ChatSidebarProps) {
  
  const handleSessionClick = (id: string) => {
    window.location.href = `/?session=${id}`
  }

  return (
    <>
      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-muted transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-4">
          
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 hidden lg:flex">
              <Leaf size={24} className="text-primary" />
              <h2 className="text-xl font-bold font-display text-foreground">PlantGuard AI</h2>
            </div>
            <button className="lg:hidden p-2 rounded-full hover:bg-black/10" onClick={() => setIsSidebarOpen(false)}>
              <Menu size={24} className="text-foreground" />
            </button>
          </div>

          <button 
            onClick={() => {
              onNewChat()
              setIsSidebarOpen(false)
            }} 
            className="flex items-center gap-2 bg-white/50 hover:bg-white/80 transition-colors border border-border p-3 rounded-2xl w-full text-left font-medium text-foreground"
          >
            <Plus size={20} /> Percakapan Baru
          </button>
          
          <div className="mt-8 flex-1 overflow-y-auto pr-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Riwayat Percakapan</p>
            {savedSessions.length === 0 ? (
              <p className="px-2 text-xs text-muted-foreground italic">Belum ada riwayat</p>
            ) : (
              savedSessions.map(session => (
                <div 
                  key={session.id}
                  onClick={() => handleSessionClick(session.id)}
                  className={`px-3 py-2 mb-1 flex flex-col gap-1 text-sm rounded-lg cursor-pointer transition-colors ${sessionId === session.id ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-black/5'}`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare size={14} className={sessionId === session.id ? 'text-primary' : 'text-muted-foreground'} />
                    <span className="truncate font-medium">{session.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground ml-5">{session.date}</span>
                </div>
              ))
            )}
          </div>

          {/* Admin link */}
          <a href="/admin" className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-2 border-t border-border mt-2">
            Admin Panel
          </a>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  )
}
