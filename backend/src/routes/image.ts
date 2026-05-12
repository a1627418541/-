import { Router } from 'express'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { imageGenerationService } from '../services/imageGeneration.js'

const router = Router()

/**
 * POST /api/images/generate
 * Generate an image from text prompt (authenticated)
 */
router.post('/generate', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { prompt, size = '1024*1024' } = req.body

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ success: false, error: 'Prompt is required' })
      return
    }

    const imageUrl = await imageGenerationService.generateImage(prompt, { size })

    res.json({
      success: true,
      data: {
        url: imageUrl,
        prompt,
        size,
      },
    })
  } catch (err: any) {
    console.error('[Image Generation] Error:', err.message)
    res.status(500).json({
      success: false,
      error: err.message || 'Image generation failed',
    })
  }
})

/**
 * GET /api/images/health
 * Check if image generation service is configured
 */
router.get('/health', (req, res) => {
  const isConfigured = !!process.env.DASHSCOPE_API_KEY
  res.json({
    success: true,
    data: {
      configured: isConfigured,
      model: process.env.DASHSCOPE_IMAGE_MODEL || 'qwen-image-2.0-pro',
    },
  })
})

export default router
