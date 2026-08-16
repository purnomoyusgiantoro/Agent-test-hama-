import React from 'react'
import { Camera, X } from 'lucide-react'

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export default function CameraModal({
  isOpen,
  onClose,
  onCapture,
  videoRef,
  canvasRef
}: CameraModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center animate-in fade-in">
      <div className="relative w-full h-full max-w-4xl mx-auto flex flex-col">
        <div className="flex justify-between items-center p-4 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
          <h3 className="text-white font-medium">Ambil Foto Tanaman</h3>
          <button onClick={onClose} className="p-2 text-white bg-black/50 rounded-full hover:bg-black/80 transition-colors">
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
            onClick={onCapture} 
            className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center hover:bg-gray-200 transition-colors focus:ring-4 focus:ring-white/50"
          >
            <Camera size={24} className="text-black" />
          </button>
        </div>
      </div>
    </div>
  )
}
