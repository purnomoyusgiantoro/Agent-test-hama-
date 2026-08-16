import { Hono } from 'hono'
import { z } from 'zod'
import { getAgentConfig, saveChatMessage, getChatHistory } from '../services/db'
import { generateGeminiContent, GeminiAttachment } from '../services/ai'
import { PLANT_DETECTION_PROMPT } from '../utils/prompts/plantPrompt'

const chatRouter = new Hono<{ Bindings: CloudflareBindings }>()

const AttachmentSchema = z.object({
  mimeType: z.string(),
  data: z.string()
});

const ChatRequestSchema = z.object({
  sessionId: z.string().min(1).max(100).trim(),
  prompt: z.string().max(2000).trim().optional(),
  attachment: AttachmentSchema.optional()
})

chatRouter.post('/', async (c) => {
  try {
    const body = await c.req.json()
    
    const result = ChatRequestSchema.safeParse(body)
    if (!result.success) {
      return c.json({ 
        error: 'Validasi gagal', 
        details: result.error.flatten() 
      }, 400)
    }

    const { sessionId, prompt, attachment } = result.data

    if (!prompt && !attachment) {
      return c.json({ error: 'Harus mengirimkan prompt atau gambar' }, 400)
    }

    // 1. Get Agent Config
    const config = await getAgentConfig(c.env.DB)
    const systemPrompt = config['system_prompt'] || PLANT_DETECTION_PROMPT
    const modelName = config['model_name'] || 'gemini-2.5-flash'
    const temperature = parseFloat(config['temperature'] || '0.7')

    // 2. Save user message to SQLite
    const dbMessage = prompt || ''
    const savedMessage = attachment ? (dbMessage ? `[Gambar terlampir]\n${dbMessage}` : '[Gambar terlampir]') : dbMessage
    
    await saveChatMessage(c.env.DB, sessionId, 'user', savedMessage)

    // 3. Get History (excluding the one we just saved)
    const allHistory = await getChatHistory(c.env.DB, sessionId)
    const history = allHistory.slice(0, -1) // Remove the last item (current message)

    // 4. Call Gemini AI
    if (!c.env.AI_API_KEY) {
      throw new Error('AI_API_KEY tidak ditemukan di environment variables')
    }

    const aiResponse = await generateGeminiContent(
      c.env.AI_API_KEY,
      modelName,
      systemPrompt,
      temperature,
      history,
      prompt,
      attachment as GeminiAttachment | undefined
    )

    // 5. Save AI message
    await saveChatMessage(c.env.DB, sessionId, 'ai', aiResponse)

    return c.json({ response: aiResponse })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Terjadi kesalahan pada server' }, 500)
  }
})

chatRouter.get('/:sessionId/history', async (c) => {
  try {
    const sessionId = c.req.param('sessionId')
    const history = await getChatHistory(c.env.DB, sessionId)
    return c.json({ success: true, data: history })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Gagal mengambil riwayat chat' }, 500)
  }
})

export default chatRouter
