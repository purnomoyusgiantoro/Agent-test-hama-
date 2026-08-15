import { useState } from 'react'

function App() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{role: string, text: string}[]>([])

  const sendMessage = async () => {
    if (!input) return
    setMessages([...messages, { role: 'user', text: input }])
    
    // URL ini sekarang mengarah ke server Cloudflare Anda yang sudah online
    const res = await fetch('https://agent-backend.pyxvin124.workers.dev/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'session-1', prompt: input })
    })
    const data = await res.json()
    
    setMessages(prev => [...prev, { role: 'ai', text: data.response }])
    setInput('')
  }

  return (
    // Tailwind: mx-auto dan max-w-2xl membuat tampilan bagus di HP dan Laptop
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white shadow-md rounded-lg p-6 h-[80vh] flex flex-col">
        <h1 className="text-xl font-bold mb-4 text-center">AI Agent</h1>
        
        <div className="flex-1 overflow-y-auto mb-4 space-y-2">
          {messages.map((msg, idx) => (
            <div key={idx} className={`p-2 rounded ${msg.role === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-200 text-left'}`}>
              {msg.text}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input 
            type="text" 
            value={input} 
            onChange={e => setInput(e.target.value)}
            className="flex-1 border p-2 rounded"
            placeholder="Ketik sesuatu..."
          />
          <button onClick={sendMessage} className="bg-blue-600 text-white px-4 py-2 rounded">
            Kirim
          </button>
        </div>
      </div>
    </div>
  )
}

export default App