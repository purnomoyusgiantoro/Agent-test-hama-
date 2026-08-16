import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import chatRouter from './routes/chat'
import adminRouter from './routes/admin'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Security headers
app.use('*', secureHeaders())

// CORS
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