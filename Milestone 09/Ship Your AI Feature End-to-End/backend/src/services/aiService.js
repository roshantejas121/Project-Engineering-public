import fetch from 'node-fetch'
import { buildPrompt } from '../utils/promptBuilder.js'

const MODEL = process.env.AI_MODEL || 'openai/gpt-4o-mini'
const TIMEOUT_MS = 15000
const API_BASE_URL = (process.env.AI_API_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '')

function getApiKey() {
  return process.env.AI_API_KEY || process.env.OPENROUTER_API_KEY
}

function serviceError(message, statusCode = 502) {
  const error = new Error(message)
  error.statusCode = statusCode
  error.publicMessage = message
  return error
}

export async function callCodeContextAI({ code, context, clientId }) {
  if (!getApiKey()) {
    throw serviceError('The AI service is not configured yet. Add an API key on the backend.', 503)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
        'X-Title': 'Code Context Companion'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: buildPrompt({ code, context }),
        max_completion_tokens: 650,
        temperature: 0.2,
        response_format: { type: 'json_object' }
      }),
      signal: controller.signal
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data?.error?.message || `OpenRouter returned HTTP ${response.status}`)
    }

    const content = data?.choices?.[0]?.message?.content
    if (!content) throw new Error('The AI response did not contain any content.')

    console.log('[AI_USAGE]', JSON.stringify({
      timestamp: new Date().toISOString(),
      clientId,
      model: MODEL,
      promptTokens: data.usage?.prompt_tokens ?? null,
      completionTokens: data.usage?.completion_tokens ?? null,
      totalTokens: data.usage?.total_tokens ?? null,
      endpoint: 'code-context-analysis'
    }))

    try {
      return JSON.parse(content)
    } catch {
      throw new Error('The AI returned an invalid structured response.')
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw serviceError('The analysis took too long. Please try again with a smaller change.')
    }
    console.error('[AI_ERROR]', error.message)
    if (error.statusCode) throw error
    throw serviceError('The analysis service is temporarily unavailable. Please try again shortly.')
  } finally {
    clearTimeout(timeoutId)
  }
}

export { MODEL }
