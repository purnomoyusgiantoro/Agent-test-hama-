import { useState, useEffect } from 'react'

export interface SessionInfo {
  id: string;
  title: string;
  date: string;
}

export interface Message {
  role: string;
  text: string;
  attachmentUrl?: string;
  products?: Array<{
    id: number;
    name: string;
    price: number;
    image_url: string;
    shopee_url: string;
  }>;
}

export function useChatSession() {
  const [sessionId, setSessionId] = useState<string>('')
  const [savedSessions, setSavedSessions] = useState<SessionInfo[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionParam = params.get('session')
    
    const localSessions = JSON.parse(localStorage.getItem('plantguard_sessions') || '[]')
    setSavedSessions(localSessions)

    if (sessionParam) {
      setSessionId(sessionParam)
      fetchHistory(sessionParam)
    } else {
      const newId = crypto.randomUUID()
      setSessionId(newId)
      window.history.replaceState(null, '', `?session=${newId}`)
    }
  }, [])

  const fetchHistory = async (sid: string) => {
    setIsLoading(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'
      const res = await fetch(`${API_URL}/api/chat/${sid}/history`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data) {
          const loadedMessages: Message[] = data.data.map((msg: any) => ({
            role: msg.role === 'ai' ? 'ai' : 'user',
            text: msg.message
          }))
          setMessages(loadedMessages)
        }
      }
    } catch (err) {
      console.error('Failed to fetch history:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewChat = () => {
    const newId = crypto.randomUUID()
    setSessionId(newId)
    setMessages([])
    window.history.pushState(null, '', `?session=${newId}`)
  }

  const switchSession = (sid: string) => {
    if (sid === sessionId) return;
    setSessionId(sid)
    setMessages([])
    window.history.pushState(null, '', `?session=${sid}`)
    fetchHistory(sid)
  }

  const saveSessionLocally = (sid: string, firstMessage: string) => {
    const localSessions: SessionInfo[] = JSON.parse(localStorage.getItem('plantguard_sessions') || '[]')
    if (!localSessions.find(s => s.id === sid)) {
      const newSession = {
        id: sid,
        title: firstMessage.substring(0, 30) + (firstMessage.length > 30 ? '...' : ''),
        date: new Date().toLocaleDateString('id-ID')
      }
      const updated = [newSession, ...localSessions]
      localStorage.setItem('plantguard_sessions', JSON.stringify(updated))
      setSavedSessions(updated)
    }
  }

  return {
    sessionId,
    savedSessions,
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    handleNewChat,
    switchSession,
    saveSessionLocally
  }
}
