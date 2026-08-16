import React, { useRef, useEffect, useState } from 'react'
import { Plus, Send, X, Camera, Image as ImageIcon } from 'lucide-react'
import type { Attachment } from '../../hooks/useCamera'

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  attachment: Attachment | null;
  setAttachment: (val: Attachment | null) => void;
  isLoading: boolean;
  onSendMessage: () => void;
  onStartCamera?: () => void;
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
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen])

  const hasContent = input.trim().length > 0 || attachment !== null;

  return (
    <div className="p-4 lg:px-24 pb-8 w-full">
      <div className="max-w-3xl mx-auto relative flex flex-col bg-[#F0F4F9] focus-within:bg-white focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-transparent focus-within:border-gray-200 transition-all duration-200 rounded-[28px] p-2">
        
        {/* Attachment Preview */}
        {attachment && (
          <div className="px-14 pt-3 pb-2 flex">
            <div className="relative group">
              <img src={attachment.previewUrl} alt="Preview" className="h-16 w-16 object-cover rounded-xl border border-gray-200 shadow-sm" />
              <button 
                onClick={() => setAttachment(null)}
                className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center w-full">
          <input type="file" accept="image/*" ref={fileInputRef} onChange={onFileChange} className="hidden" />

          {/* Plus Button with Popup */}
          <div className="relative pl-1" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className={`p-2 rounded-full transition-all duration-200 shrink-0 ${isMenuOpen ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-black/5 hover:text-gray-700'}`}
              title="Lampirkan"
            >
              <Plus size={22} strokeWidth={2} className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-45' : ''}`} />
            </button>
            
            {/* Popup Menu */}
            {isMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-52 bg-white border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.1)] rounded-2xl overflow-hidden z-50">
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    onFileClick();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <ImageIcon size={16} />
                  </div>
                  <span className="font-medium">Unggah Gambar</span>
                </button>
                {onStartCamera && (
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      onStartCamera();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Camera size={16} />
                    </div>
                    <span className="font-medium">Ambil Foto</span>
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Textarea */}
          <textarea 
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                setIsMenuOpen(false);
                onSendMessage();
              }
            }}
            placeholder="Tanya PlantGuard..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none outline-none py-2.5 px-3 text-gray-700 text-[16px] placeholder:text-gray-400 leading-[1.5]"
            rows={1}
          />
        
          {/* Send Button */}
          <div className="pr-1">
            <button 
              onClick={() => {
                setIsMenuOpen(false);
                onSendMessage();
              }}
              disabled={isLoading || !hasContent}
              className={`p-2 rounded-full shrink-0 transition-all duration-200 ${
                hasContent && !isLoading
                  ? 'bg-gray-800 text-white shadow-sm hover:bg-gray-700'
                  : 'text-gray-300 cursor-default'
              }`}
            >
              <Send size={18} strokeWidth={2} className={hasContent && !isLoading ? "translate-x-[1px] -translate-y-[1px]" : ""} />
            </button>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-gray-400 mt-3">
        AI dapat membuat kesalahan. Verifikasi informasi penting.
      </p>
    </div>
  )
}
