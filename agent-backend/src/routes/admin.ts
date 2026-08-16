import { Hono } from 'hono'
import { getAgentConfig, setAgentConfig } from '../services/db'

const adminRouter = new Hono<{ Bindings: CloudflareBindings & { ADMIN_PASSWORD?: string } }>()

adminRouter.post('/login', async (c) => {
  try {
    const { password } = await c.req.json()
    const adminPassword = c.env.ADMIN_PASSWORD
    
    if (!adminPassword) {
      console.error('ADMIN_PASSWORD tidak diatur di environment')
      return c.json({ error: 'Konfigurasi server tidak valid' }, 500)
    }

    const encoder = new TextEncoder()
    const inputBuf = encoder.encode(password || '')
    const adminBuf = encoder.encode(adminPassword)

    if (inputBuf.length !== adminBuf.length) {
      return c.json({ success: false, error: 'Password salah' }, 401)
    }

    let isMatch = true
    for (let i = 0; i < adminBuf.length; i++) {
      if (inputBuf[i] !== adminBuf[i]) {
        isMatch = false
      }
    }

    if (!isMatch) {
      return c.json({ success: false, error: 'Password salah' }, 401)
    }

    return c.json({ success: true, token: 'fake-jwt-token' })
  } catch (err) {
    console.error(err)
    return c.json({ success: false, error: 'Gagal login' }, 500)
  }
})

adminRouter.get('/config', async (c) => {
  try {
    const config = await getAgentConfig(c.env.DB)
    return c.json({ success: true, config })
  } catch (err) {
    console.error(err)
    return c.json({ success: false, error: 'Gagal mengambil konfigurasi' }, 500)
  }
})

adminRouter.post('/config', async (c) => {
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

export default adminRouter
