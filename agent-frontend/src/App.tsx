import { useState } from 'react'
import { Menu, Paperclip, Camera, Send, Bot, User, Plus } from 'lucide-react'

function App() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{role: string, text: string}[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const sendMessage = async () => {
    if (!input.trim()) return
    setMessages([...messages, { role: 'user', text: input }])
    const currentInput = input
    setInput('')
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: 'session-1', prompt: currentInput })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'ai', text: data.response }])
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: 'ai', text: 'Error connecting to the server.' }])
    }
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
      
      {/* Sidebar (Desktop: Fixed, Mobile: Toggleable) */}
      <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-muted transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold font-display text-foreground hidden lg:block">Agent UI</h2>
            {/* Mobile close button inside sidebar can go here, or we let overlay handle it */}
            <button className="lg:hidden p-2 rounded-full hover:bg-black/10" onClick={() => setIsSidebarOpen(false)}>
              <Menu size={24} className="text-foreground" />
            </button>
          </div>

          <button className="flex items-center gap-2 bg-white/50 hover:bg-white/80 transition-colors border border-border p-3 rounded-2xl w-full text-left font-medium text-foreground">
            <Plus size={20} /> New Chat
          </button>
          
          <div className="mt-8 flex-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Recent</p>
            {/* Example recent chats */}
            <div className="px-2 py-2 text-sm text-foreground hover:bg-black/5 rounded-lg cursor-pointer truncate">
              What is AI?
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Chat Canvas */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* Header */}
        <header className="flex items-center p-4 lg:p-6 lg:justify-end">
          <button 
            className="p-2 -ml-2 rounded-full hover:bg-black/5 lg:hidden text-foreground"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              <User size={16} />
            </div>
          </div>
        </header>

        {/* Chat History Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:px-24">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary">
                <Bot size={32} />
              </div>
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">Hello, I'm your AI Agent.</h1>
              <p className="text-muted-foreground max-w-sm">How can I help you today? You can attach files, send photos, or just ask me a question.</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6 pb-20">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center mt-1 ${
                    msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-white border border-border text-foreground rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Area (Bottom Anchored) */}
        <div className="p-4 lg:px-24 pb-6 w-full">
          <div className="max-w-3xl mx-auto relative flex items-end bg-white border border-border shadow-sm rounded-3xl p-2 transition-shadow focus-within:shadow-md focus-within:ring-1 focus-within:ring-primary/20">
            
            {/* Attachment Buttons */}
            <button className="p-3 text-muted-foreground hover:bg-black/5 hover:text-foreground rounded-full transition-colors shrink-0">
              <Paperclip size={20} />
            </button>
            <button className="p-3 text-muted-foreground hover:bg-black/5 hover:text-foreground rounded-full transition-colors shrink-0">
              <Camera size={20} />
            </button>
            
            <textarea 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask anything..."
              className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none outline-none py-3 px-2 text-foreground"
              rows={1}
            />
            
            {/* Send Button */}
            <button 
              onClick={sendMessage}
              disabled={!input.trim()}
              className={`p-3 rounded-full shrink-0 transition-colors ${
                input.trim() 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              <Send size={18} className={input.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
            </button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            AI can make mistakes. Verify important information.
          </p>
        </div>

      </div>
    </div>
  )
}

export default App