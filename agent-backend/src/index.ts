import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import chatRouter from './routes/chat'
import adminRouter from './routes/admin'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Tambahkan secure headers (XSS Protection, HSTS, No-Sniff, dll)
app.use('*', secureHeaders())

// Izinkan Frontend mengakses API ini dengan CORS yang diperketat
app.use('/*', cors({
  origin: (origin) => {
    if (origin && (origin.endsWith('.pages.dev') || origin === 'http://localhost:5173')) {
      return origin;
    }
    return 'http://localhost:5173'; // Fallback aman
  },
}))

// Mount routes
app.route('/api/chat', chatRouter)
app.route('/api/admin', adminRouter)

export default app