import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
<<<<<<<<< Temporary merge branch 1
import { timingSafeEqual } from 'hono/utils/buffer'
import { z } from 'zod'
import { PLANT_DETECTION_PROMPT } from './plantPrompt'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Tambahkan secure headers (XSS Protection, HSTS, No-Sniff, dll)
app.use('*', secureHeaders())

// Izinkan Frontend mengakses API ini dengan CORS yang diperketat
=========
import chatRouter from './routes/chat'
import adminRouter from './routes/admin'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Security headers
app.use('*', secureHeaders())

// CORS
>>>>>>>>> Temporary merge branch 2
app.use('/*', cors({
  origin: (origin) => {
    if (origin && (origin.endsWith('.pages.dev') || origin === 'http://localhost:5173')) {
      return origin;
    }
    return 'http://localhost:5173';
  },
}))

// Mount routes
app.route('/api/chat', chatRouter)
app.route('/api/admin', adminRouter)

export default app