import React, { useState } from 'react'
import { Leaf, User, X } from 'lucide-react'
import AiMessage from '../AiMessage'
import ProductCards from './ProductCards'
import type { Message } from '../../hooks/useChatSession'

interface ChatMessageProps {
  msg: Message;
  onImageClick: (url: string) => void;
}

const ChatMessageItem = React.memo(({ msg, onImageClick }: ChatMessageProps) => {
  return (
    <div className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center mt-1 shadow-sm ${
        msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-white border border-border text-primary'
      }`}>
        {msg.role === 'user' ? <User size={16} /> : <Leaf size={16} />}
      </div>
      <div className={`max-w-[85%] rounded-3xl px-5 py-4 flex flex-col gap-3 ${
        msg.role === 'user' 
          ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-sm' 
          : 'bg-secondary text-foreground rounded-tl-sm border border-transparent shadow-sm'
      }`}>
        {msg.attachmentUrl && (
          <img 
            src={msg.attachmentUrl} 
            alt="Uploaded attachment" 
            onClick={() => onImageClick(msg.attachmentUrl!)}
            className="rounded-xl max-w-full h-auto max-h-64 object-cover border border-border/50 shadow-sm cursor-pointer hover:opacity-90 transition-opacity" 
          />
        )}
        {msg.role === 'user' ? (
          msg.text && <span className="whitespace-pre-wrap leading-relaxed">{msg.text}</span>
        ) : (
          <div className="w-full">
            <AiMessage content={msg.text} />
            {msg.products && msg.products.length > 0 && (
              <ProductCards products={msg.products} />
            )}
          </div>
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
    <>
      <div className="max-w-3xl mx-auto space-y-6 pb-20">
        {messages.map((msg, idx) => (
          <ChatMessageItem key={idx} msg={msg} onImageClick={setSelectedImage} />
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

      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X size={32} />
          </button>
          <img 
            src={selectedImage} 
            alt="Fullscreen preview" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
