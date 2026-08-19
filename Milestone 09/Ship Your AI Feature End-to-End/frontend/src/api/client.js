const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

function getClientId() {
  const key = 'code-context-client-id'
  const existing = window.localStorage.getItem(key)
  if (existing) return existing
  const generated = crypto.randomUUID ? crypto.randomUUID() : `client-${Date.now()}`
  window.localStorage.setItem(key, generated)
  return generated
}

export async function analyzeCode(code, context) {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Id': getClientId()
    },
    body: JSON.stringify({ code, context })
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'The backend could not analyze this change.')
  return data
}
