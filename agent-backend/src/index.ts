import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Izinkan Frontend mengakses API ini
app.use('/*', cors())

app.post('/api/chat', async (c) => {
  const { sessionId, prompt } = await c.req.json()

  // 1. Simpan input user ke SQLite
  await c.env.DB.prepare('INSERT INTO chat_history (session_id, role, message) VALUES (?, ?, ?)')
    .bind(sessionId, 'user', prompt).run()

  // 2. Panggil Model AI (Contoh integrasi ke DeepSeek, Google AI Pro, atau Workers AI)
  // Di skenario nyata, ini adalah fungsi fetch() ke API AI pilihanmu
  const aiResponse = `Memproses: "${prompt}"... (Simulasi respon AI)`

  // 3. Simpan jawaban AI ke SQLite
  await c.env.DB.prepare('INSERT INTO chat_history (session_id, role, message) VALUES (?, ?, ?)')
    .bind(sessionId, 'ai', aiResponse).run()

  return c.json({ response: aiResponse })
})

export default app