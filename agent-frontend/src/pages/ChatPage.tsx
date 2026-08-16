import { useState, useRef, useEffect } from 'react'
import { Menu, Paperclip, Camera, Send, User, Plus, X, Leaf } from 'lucide-react'

interface Attachment {
  mimeType: string;
  data: string;
  previewUrl: string;
}

interface Message {
  role: string;
  text: string;
  attachmentUrl?: string;
}

export default function ChatPage() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)

  const startCamera = async () => {
    setIsCameraOpen(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      alert("Tidak dapat mengakses kamera. Pastikan izin diberikan.")
      setIsCameraOpen(false)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsCameraOpen(false)
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        const base64Data = dataUrl.split(',')[1]
        
        setAttachment({
          mimeType: 'image/jpeg',
          data: base64Data,
          previewUrl: dataUrl
        })
        stopCamera()
      }
    }
  }

  useEffect(() => {
    return () => { stopCamera() }
  }, [])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      const base64Data = result.split(',')[1]
      setAttachment({
        mimeType: file.type,
        data: base64Data,
        previewUrl: result
      })
    }
    reader.readAsDataURL(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const sendMessage = async () => {
    if (!input.trim() && !attachment) return
    
    const newMsg: Message = { role: 'user', text: input }
    if (attachment) newMsg.attachmentUrl = attachment.previewUrl
    setMessages(prev => [...prev, newMsg])
    
    const currentInput = input
    const currentAttachment = attachment
    
    setInput('')
    setAttachment(null)
    setIsLoading(true)
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'
      
      const payload: any = { sessionId: 'session-1' }
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
        setMessages(prev => [...prev, { role: 'ai', text: data.response }])
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: data.error || 'Server returned an error.' }])
      }
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: 'ai', text: 'Error connecting to the server.' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
      
      {/* Sidebar */}
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

          <button className="flex items-center gap-2 bg-white/50 hover:bg-white/80 transition-colors border border-border p-3 rounded-2xl w-full text-left font-medium text-foreground">
            <Plus size={20} /> Percakapan Baru
          </button>
          
          <div className="mt-8 flex-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Riwayat</p>
            <div className="px-2 py-2 text-sm text-foreground hover:bg-black/5 rounded-lg cursor-pointer truncate">
              Deteksi penyakit tomat
            </div>
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

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center animate-in fade-in">
          <div className="relative w-full h-full max-w-4xl mx-auto flex flex-col">
            <div className="flex justify-between items-center p-4 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
              <h3 className="text-white font-medium">Ambil Foto Tanaman</h3>
              <button onClick={stopCamera} className="p-2 text-white bg-black/50 rounded-full hover:bg-black/80 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="flex-1 w-full object-cover sm:object-contain bg-black"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center bg-gradient-to-t from-black/80 to-transparent">
              <button 
                onClick={captureImage} 
                className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center hover:bg-gray-200 transition-colors focus:ring-4 focus:ring-white/50"
              >
                <Camera size={24} className="text-black" />
              </button>
            </div>
          </div>
        </div>
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
                <Leaf size={32} />
              </div>
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">PlantGuard AI</h1>
              <p className="text-muted-foreground max-w-sm">Kirim foto tanaman Anda yang terserang hama atau penyakit, dan saya akan membantu menganalisis serta memberikan saran penanganan.</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6 pb-20">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center mt-1 ${
                    msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {msg.role === 'user' ? <User size={16} /> : <Leaf size={16} />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3 flex flex-col gap-2 ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-white border border-border text-foreground rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.attachmentUrl && (
                      <img src={msg.attachmentUrl} alt="Uploaded attachment" className="rounded-xl max-w-full h-auto max-h-64 object-cover border border-border/50 shadow-sm" />
                    )}
                    {msg.text && <span className="whitespace-pre-wrap">{msg.text}</span>}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center mt-1 bg-secondary text-secondary-foreground">
                    <Leaf size={16} />
                  </div>
                  <div className="bg-white border border-border rounded-2xl rounded-tl-sm shadow-sm px-5 py-4">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 lg:px-24 pb-6 w-full">
          <div className="max-w-3xl mx-auto relative flex flex-col bg-white border border-border shadow-sm rounded-3xl p-2 transition-shadow focus-within:shadow-md focus-within:ring-1 focus-within:ring-primary/20">
            
            {/* Attachment Preview */}
            {attachment && (
              <div className="px-3 pt-3 pb-2 flex">
                <div className="relative group">
                  <img src={attachment.previewUrl} alt="Preview" className="h-16 w-16 object-cover rounded-xl border border-border shadow-sm" />
                  <button 
                    onClick={() => setAttachment(null)}
                    className="absolute -top-2 -right-2 bg-foreground text-background rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-end w-full">
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

              <button onClick={() => fileInputRef.current?.click()} className="p-3 text-muted-foreground hover:bg-black/5 hover:text-foreground rounded-full transition-colors shrink-0" title="Upload Gambar">
                <Paperclip size={20} />
              </button>
              <button onClick={startCamera} className="p-3 text-muted-foreground hover:bg-black/5 hover:text-foreground rounded-full transition-colors shrink-0" title="Ambil Foto dari Kamera">
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
                placeholder="Deskripsikan gejala tanaman Anda..."
                className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none outline-none py-3 px-2 text-foreground"
                rows={1}
              />
            
              <button 
                onClick={sendMessage}
                disabled={(!input.trim() && !attachment) || isLoading}
                className={`p-3 rounded-full shrink-0 transition-colors ${
                  (input.trim() || attachment) && !isLoading
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                <Send size={18} className={(input.trim() || attachment) && !isLoading ? "translate-x-0.5 -translate-y-0.5" : ""} />
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            AI dapat membuat kesalahan. Verifikasi informasi penting dengan ahli pertanian.
          </p>
        </div>

      </div>
    </div>
  )
}
