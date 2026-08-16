import { useState, useRef } from 'react'
import { Menu, Share2 } from 'lucide-react'

// Hooks
import { useChatSession } from '../hooks/useChatSession'
import { useCamera } from '../hooks/useCamera'

// Components
import ChatSidebar from '../components/chat/ChatSidebar'
import ChatHistory from '../components/chat/ChatHistory'
import ChatInput from '../components/chat/ChatInput'
import CameraModal from '../components/shared/CameraModal'

export default function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [input, setInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  const {
    sessionId,
    savedSessions,
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    handleNewChat,
    switchSession,
    saveSessionLocally
  } = useChatSession()

  const {
    isCameraOpen,
    attachment,
    setAttachment,
    videoRef,
    canvasRef,
    fileInputRef,
    startCamera,
    stopCamera,
    captureImage,
    handleFileChange
  } = useCamera()

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    alert('Link sesi percakapan disalin ke clipboard!')
  }

  const sendMessage = async () => {
    if (!input.trim() && !attachment) return
    
    if (messages.length === 0) {
      saveSessionLocally(sessionId, input || 'Gambar terlampir')
    }
    
    const newMsg = { role: 'user', text: input, attachmentUrl: attachment?.previewUrl }
    setMessages(prev => [...prev, newMsg])
    
    const currentInput = input
    const currentAttachment = attachment
    
    setInput('')
    setAttachment(null)
    setIsLoading(true)
    
    // Auto-scroll
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'
      
      const payload: any = { sessionId }
      if (currentInput.trim()) payload.prompt = currentInput
      if (currentAttachment) {
        payload.attachment = {
          mimeType: currentAttachment.mimeType,
          data: currentAttachment.data
        }
      }

      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'ai', text: data.response, products: data.products || [] }])
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: data.error || 'Server returned an error.' }])
      }
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: 'ai', text: 'Error connecting to the server.' }])
    } finally {
      setIsLoading(false)
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
      
      <ChatSidebar 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        sessionId={sessionId}
        savedSessions={savedSessions}
        onNewChat={handleNewChat}
        onSwitchSession={switchSession}
      />

      <CameraModal 
        isOpen={isCameraOpen}
        onClose={stopCamera}
        onCapture={captureImage}
        videoRef={videoRef}
        canvasRef={canvasRef}
      />

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
          <div className="ml-auto flex items-center gap-3">
            <button onClick={handleShare} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-foreground bg-white border border-border shadow-sm rounded-full hover:bg-muted transition-colors">
              <Share2 size={14} />
              <span className="hidden sm:inline">Bagikan Chat</span>
            </button>
          </div>
        </header>

        {/* Chat History Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:px-24">
          <ChatHistory 
            messages={messages} 
            isLoading={isLoading} 
            chatEndRef={chatEndRef} 
          />
        </div>

        {/* Input Area */}
        <ChatInput 
          input={input}
          setInput={setInput}
          attachment={attachment}
          setAttachment={setAttachment}
          isLoading={isLoading}
          onSendMessage={sendMessage}
          onStartCamera={startCamera}
          onFileClick={() => fileInputRef.current?.click()}
          fileInputRef={fileInputRef}
          onFileChange={handleFileChange}
        />

      </div>
    </div>
  )
}
