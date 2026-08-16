import React from 'react'
import { Paperclip, Camera, Send, X } from 'lucide-react'
import type { Attachment } from '../../hooks/useCamera'

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  attachment: Attachment | null;
  setAttachment: (val: Attachment | null) => void;
  isLoading: boolean;
  onSendMessage: () => void;
  onStartCamera: () => void;
  onFileClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ChatInput({
  input,
  setInput,
  attachment,
  setAttachment,
  isLoading,
  onSendMessage,
  onStartCamera,
  onFileClick,
  fileInputRef,
  onFileChange
}: ChatInputProps) {
  return (
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
          <input type="file" accept="image/*" ref={fileInputRef} onChange={onFileChange} className="hidden" />

          <button onClick={onFileClick} className="p-3 text-muted-foreground hover:bg-black/5 hover:text-foreground rounded-full transition-colors shrink-0" title="Upload Gambar">
            <Paperclip size={20} />
          </button>
          <button onClick={onStartCamera} className="p-3 text-muted-foreground hover:bg-black/5 hover:text-foreground rounded-full transition-colors shrink-0" title="Ambil Foto dari Kamera">
            <Camera size={20} />
          </button>
          
          <textarea 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSendMessage();
              }
            }}
            placeholder="Deskripsikan gejala tanaman Anda..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none outline-none py-3 px-2 text-foreground"
            rows={1}
          />
        
          <button 
            onClick={onSendMessage}
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
  )
}
