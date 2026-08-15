import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { HUMANIZER_PROMPT } from './humanizerPrompt'

const app = new Hono<{ Bindings: CloudflareBindings }>()

const allowedOrigins = [
  'http://localhost:5173',
  'https://61afd88e.agent-frontend-bn0.pages.dev'
]

// Izinkan Frontend mengakses API ini dengan CORS yang diperketat
app.use('/*', cors({
  origin: allowedOrigins,
}))

// Skema validasi menggunakan Zod (Mitigasi Input Injection & Malformed Data)
const ChatRequestSchema = z.object({
  sessionId: z.string().min(1).max(100).trim(),
  prompt: z.string().min(1).max(2000).trim(),
})

app.post('/api/chat', async (c) => {
  try {
    const body = await c.req.json()
    
    // Validasi payload
    const result = ChatRequestSchema.safeParse(body)
    if (!result.success) {
      return c.json({ 
        error: 'Validasi gagal', 
        details: result.error.flatten() 
      }, 400)
    }

    const { sessionId, prompt } = result.data

    // 1. Simpan input user ke SQLite (sudah parameterized via .bind)
    await c.env.DB.prepare('INSERT INTO chat_history (session_id, role, message) VALUES (?, ?, ?)')
      .bind(sessionId, 'user', prompt).run()

    // 2. Panggil Model AI (Google Gemini 2.5 Flash)
    if (!c.env.AI_API_KEY) {
      throw new Error('AI_API_KEY tidak ditemukan di environment variables')
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${c.env.AI_API_KEY}`
    
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: HUMANIZER_PROMPT }] },
        contents: [{ parts: [{ text: prompt }] }]
      })
    })

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini API Error:', errorText)
      throw new Error('Gagal menghubungi Gemini API')
    }

    const geminiData = (await geminiResponse.json()) as any
    // Ekstrak teks balasan dari struktur data Gemini
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, saya tidak bisa merespons saat ini.'

    // 3. Simpan jawaban AI ke SQLite
    await c.env.DB.prepare('INSERT INTO chat_history (session_id, role, message) VALUES (?, ?, ?)')
      .bind(sessionId, 'ai', aiResponse).run()

    return c.json({ response: aiResponse })
  } catch (err) {
    console.error(err)
    // Jangan bocorkan stack trace error ke pengguna
    return c.json({ error: 'Terjadi kesalahan pada server' }, 500)
  }
})

export default app