import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { timingSafeEqual } from 'hono/utils/buffer'
import { z } from 'zod'
import { PLANT_DETECTION_PROMPT } from './plantPrompt'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Tambahkan secure headers (XSS Protection, HSTS, No-Sniff, dll)
app.use('*', secureHeaders())

// Izinkan Frontend mengakses API ini dengan CORS yang diperketat
app.use('/*', cors({
  origin: (origin) => {
    const allowedOrigins = [
      'https://64847ed7.agent-frontend-bn0.pages.dev',
      'http://localhost:5173'
    ];
    if (origin && allowedOrigins.includes(origin)) {
      return origin;
    }
    return 'http://localhost:5173'; // Fallback aman
  },
}))

// Skema validasi menggunakan Zod (Mitigasi Input Injection & Malformed Data)
const AttachmentSchema = z.object({
  mimeType: z.string(),
  data: z.string() // base64 without prefix
});

const ChatRequestSchema = z.object({
  sessionId: z.string().min(1).max(100).trim(),
  prompt: z.string().max(2000).trim().optional(),
  attachment: AttachmentSchema.optional()
})

// ============================================================
// Helper: Baca konfigurasi agent dari D1
// ============================================================
async function getAgentConfig(db: any): Promise<Record<string, string>> {
  const rows = await db.prepare('SELECT key, value FROM agent_config').all()
  const config: Record<string, string> = {}
  for (const row of rows.results ?? []) {
    config[(row as any).key] = (row as any).value
  }
  return config
}

// ============================================================
// CHAT ENDPOINT
// ============================================================
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

    const { sessionId, prompt, attachment } = result.data

    if (!prompt && !attachment) {
      return c.json({ error: 'Harus ada prompt atau gambar' }, 400)
    }

    // 1. Baca konfigurasi agent dari database
    const config = await getAgentConfig(c.env.DB)
    const systemPrompt = config['system_prompt'] || PLANT_DETECTION_PROMPT
    const modelName = config['model_name'] || 'gemini-2.5-flash'
    const temperature = parseFloat(config['temperature'] || '0.7')

    // 2. Simpan input user ke SQLite
    const dbMessage = prompt || ''
    const savedMessage = attachment ? (dbMessage ? `[Gambar terlampir]\n${dbMessage}` : '[Gambar terlampir]') : dbMessage
    
    await c.env.DB.prepare('INSERT INTO chat_history (session_id, role, message) VALUES (?, ?, ?)')
      .bind(sessionId, 'user', savedMessage).run()

    // 3. Panggil Model AI (Google Gemini)
    if (!c.env.AI_API_KEY) {
      throw new Error('AI_API_KEY tidak ditemukan di environment variables')
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${c.env.AI_API_KEY}`
    
    const parts: any[] = [];
    if (prompt) {
      parts.push({ text: prompt });
    }
    if (attachment) {
      parts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.data
        }
      });
    }

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts }],
        generationConfig: {
          temperature: temperature
        }
      })
    })

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini API Error:', errorText)
      throw new Error('Gagal menghubungi Gemini API')
    }

    const geminiData = (await geminiResponse.json()) as any
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, saya tidak bisa merespons saat ini.'

    // 4. Simpan jawaban AI ke SQLite
    await c.env.DB.prepare('INSERT INTO chat_history (session_id, role, message) VALUES (?, ?, ?)')
      .bind(sessionId, 'ai', aiResponse).run()

    return c.json({ response: aiResponse })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Terjadi kesalahan pada server' }, 500)
  }
})

// ============================================================
// ADMIN ENDPOINTS
// ============================================================

// Middleware: Verifikasi admin token dengan constant-time comparison
const adminAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const token = authHeader.replace('Bearer ', '')
  const adminPassword = (c.env as any).ADMIN_PASSWORD
  
  if (!adminPassword) {
    console.error('CRITICAL SECURITY ERROR: ADMIN_PASSWORD is not set in environment variables.')
    return c.json({ error: 'Server configuration error' }, 500)
  }

  const isValid = await timingSafeEqual(token, adminPassword)
  if (!isValid) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }
  await next()
}

// POST /api/admin/login - Verifikasi password admin
app.post('/api/admin/login', async (c) => {
  try {
    const { password } = await c.req.json()
    const adminPassword = (c.env as any).ADMIN_PASSWORD

    if (!adminPassword) {
      console.error('CRITICAL SECURITY ERROR: ADMIN_PASSWORD is not set in environment variables.')
      return c.json({ error: 'Server configuration error' }, 500)
    }

    const isValid = await timingSafeEqual(password, adminPassword)
    if (isValid) {
      return c.json({ success: true, token: adminPassword })
    }
    return c.json({ error: 'Password salah' }, 401)
  } catch {
    return c.json({ error: 'Request tidak valid' }, 400)
  }
})

// GET /api/admin/config - Baca semua konfigurasi
app.get('/api/admin/config', adminAuth, async (c) => {
  try {
    const config = await getAgentConfig(c.env.DB)
    return c.json({ config })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Gagal membaca konfigurasi' }, 500)
  }
})

// PUT /api/admin/config - Update konfigurasi
app.put('/api/admin/config', adminAuth, async (c) => {
  try {
    const updates = await c.req.json() as Record<string, string>
    const allowedKeys = ['system_prompt', 'model_name', 'temperature', 'agent_name']
    
    for (const [key, value] of Object.entries(updates)) {
      if (!allowedKeys.includes(key)) continue
      await c.env.DB.prepare(
        'INSERT INTO agent_config (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
      ).bind(key, String(value)).run()
    }

    return c.json({ success: true })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Gagal menyimpan konfigurasi' }, 500)
  }
})

// GET /api/admin/history - Baca riwayat chat
app.get('/api/admin/history', adminAuth, async (c) => {
  try {
    const limit = Number(c.req.query('limit') || '50')
    const rows = await c.env.DB.prepare(
      'SELECT id, session_id, role, message, created_at FROM chat_history ORDER BY id DESC LIMIT ?'
    ).bind(limit).all()
    return c.json({ history: rows.results ?? [] })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Gagal membaca riwayat chat' }, 500)
  }
})

export default app