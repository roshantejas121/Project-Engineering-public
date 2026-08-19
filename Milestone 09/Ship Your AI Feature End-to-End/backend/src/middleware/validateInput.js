const MAX_INPUT_LENGTH = 12000

export function validateAnalyzeInput(req, res, next) {
  const { code, context } = req.body ?? {}
  const trimmedCode = typeof code === 'string' ? code.trim() : ''
  const trimmedContext = typeof context === 'string' ? context.trim() : ''

  if (!trimmedCode) {
    return res.status(400).json({
      error: 'code_required',
      message: 'Paste a code change or snippet before running an analysis.'
    })
  }

  if (trimmedCode.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({
      error: 'code_too_long',
      limit: MAX_INPUT_LENGTH,
      message: `Keep the code input under ${MAX_INPUT_LENGTH.toLocaleString()} characters.`
    })
  }

  if (trimmedContext.length > 800) {
    return res.status(400).json({
      error: 'context_too_long',
      limit: 800,
      message: 'Keep the context under 800 characters.'
    })
  }

  req.analysisInput = { code: trimmedCode, context: trimmedContext }
  next()
}
