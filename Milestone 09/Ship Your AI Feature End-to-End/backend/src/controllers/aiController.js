import { callCodeContextAI } from '../services/aiService.js'

export async function analyzeCodeContext(req, res) {
  const { code, context } = req.analysisInput
  const clientId = req.get('X-Client-Id') || 'anonymous'

  try {
    const result = await callCodeContextAI({ code, context, clientId })
    res.json({ success: true, result })
  } catch (error) {
    console.error('[ANALYSIS_ERROR]', error.message)
    res.status(error.statusCode || 502).json({
      error: 'analysis_unavailable',
      message: error.publicMessage || 'The analysis service is unavailable. Please try again shortly.'
    })
  }
}
