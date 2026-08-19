import express from 'express'
import { analyzeCodeContext } from '../controllers/aiController.js'
import { validateAnalyzeInput } from '../middleware/validateInput.js'

const router = express.Router()
router.post('/analyze', validateAnalyzeInput, analyzeCodeContext)

export default router
