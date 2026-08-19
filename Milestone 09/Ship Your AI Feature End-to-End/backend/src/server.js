import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import { analyzeCodeContext } from './controllers/aiController.js'
import { validateAnalyzeInput } from './middleware/validateInput.js'

const app = express()
const PORT = process.env.PORT || 3000
const allowedOrigins = (process.env.FRONTEND_URLS || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors({
  origin: allowedOrigins.includes('*') ? true : allowedOrigins,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-Client-Id']
}))
app.use(express.json({ limit: '40kb' }))

const aiRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.get('X-Client-Id') || req.ip,
  handler: (_req, res) => {
    res.status(429).json({
      error: 'rate_limit_exceeded',
      message: 'You have used the 20-analysis hourly limit. Please try again later.'
    })
  }
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'code-context-companion' })
})

app.post('/api/analyze', aiRateLimit, validateAnalyzeInput, analyzeCodeContext)

app.use((err, _req, res, _next) => {
  console.error('[UNHANDLED_ERROR]', err)
  res.status(500).json({ error: 'server_error', message: 'Something went wrong. Please try again.' })
})

app.listen(PORT, () => {
  console.log(`Code Context Companion backend listening on port ${PORT}`)
})
