import { useState, useRef, useEffect } from 'react'

export interface Attachment {
  mimeType: string;
  data: string;
  previewUrl: string;
}

export function useCamera() {
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    return () => { stopCamera() }
  }, [])

  return {
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
  }
}
