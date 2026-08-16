import { Hono } from 'hono'
import { timingSafeEqual } from 'hono/utils/buffer'
import { getAgentConfig, setAgentConfig } from '../services/db'

const adminRouter = new Hono<{ Bindings: CloudflareBindings & { ADMIN_PASSWORD?: string } }>()

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

adminRouter.post('/login', async (c) => {
  try {
    const { password } = await c.req.json()
    const adminPassword = c.env.ADMIN_PASSWORD
    
    if (!adminPassword) {
      console.error('ADMIN_PASSWORD tidak diatur di environment')
      return c.json({ error: 'Konfigurasi server tidak valid' }, 500)
    }

    const isValid = await timingSafeEqual(password, adminPassword)
    if (isValid) {
      return c.json({ success: true, token: adminPassword })
    }
    
    return c.json({ success: false, error: 'Password salah' }, 401)
  } catch (err) {
    console.error(err)
    return c.json({ success: false, error: 'Gagal login' }, 500)
  }
})

adminRouter.get('/config', adminAuth, async (c) => {
  try {
    const config = await getAgentConfig(c.env.DB)
    return c.json({ success: true, config })
  } catch (err) {
    console.error(err)
    return c.json({ success: false, error: 'Gagal mengambil konfigurasi' }, 500)
  }
})

adminRouter.post('/config', adminAuth, async (c) => {
  try {
    const { config } = await c.req.json()
    
    for (const [key, value] of Object.entries(config)) {
      await setAgentConfig(c.env.DB, key, value as string)
    }

    return c.json({ success: true })
  } catch (err) {
    console.error(err)
    return c.json({ success: false, error: 'Gagal menyimpan konfigurasi' }, 500)
  }
})

adminRouter.get('/history', adminAuth, async (c) => {
  try {
    const limit = Number(c.req.query('limit') || '50')
    const rows = await c.env.DB.prepare(
      'SELECT id, session_id, role, message, created_at FROM chat_history ORDER BY id DESC LIMIT ?'
    ).bind(limit).all()
    return c.json({ success: true, history: rows.results ?? [] })
  } catch (err) {
    console.error(err)
    return c.json({ success: false, error: 'Gagal membaca riwayat chat' }, 500)
  }
})

export default adminRouter
