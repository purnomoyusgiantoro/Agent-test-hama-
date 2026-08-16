import React from 'react'
import { Leaf, User } from 'lucide-react'
import AiMessage from '../AiMessage'
import type { Message } from '../../hooks/useChatSession'

interface ChatMessageProps {
  msg: Message;
}

// Gunakan React.memo agar pesan yang sudah ada tidak dirender ulang saat user mengetik
const ChatMessageItem = React.memo(({ msg }: ChatMessageProps) => {
  return (
    <div className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center mt-1 ${
        msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
      }`}>
        {msg.role === 'user' ? <User size={16} /> : <Leaf size={16} />}
      </div>
      <div className={`max-w-[85%] rounded-2xl px-5 py-4 flex flex-col gap-3 ${
        msg.role === 'user' 
          ? 'bg-primary text-primary-foreground rounded-tr-sm' 
          : 'bg-white border border-border text-foreground rounded-tl-sm shadow-sm'
      }`}>
        {msg.attachmentUrl && (
          <img src={msg.attachmentUrl} alt="Uploaded attachment" className="rounded-xl max-w-full h-auto max-h-64 object-cover border border-border/50 shadow-sm" />
        )}
        {msg.role === 'user' ? (
          msg.text && <span className="whitespace-pre-wrap">{msg.text}</span>
        ) : (
          <AiMessage content={msg.text} />
        )}
      </div>
    </div>
  )
})

ChatMessageItem.displayName = 'ChatMessageItem'

interface ChatHistoryProps {
  messages: Message[];
  isLoading: boolean;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function ChatHistory({ messages, isLoading, chatEndRef }: ChatHistoryProps) {
  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary">
          <Leaf size={32} />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">PlantGuard AI</h1>
        <p className="text-muted-foreground max-w-sm">Kirim foto tanaman Anda yang terserang hama atau penyakit, dan saya akan membantu menganalisis serta memberikan saran penanganan.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {messages.map((msg, idx) => (
        <ChatMessageItem key={idx} msg={msg} />
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
  )
}
