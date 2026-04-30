import { Router } from 'express'
import { prisma } from '../utils/prisma.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { getCharacter, buildSystemPrompt } from '../services/character.js'
import { calculateRelationshipStage, analyzeMessageImpact, checkEventTriggers } from '../services/game.js'
import type { GameStateSnapshot } from '../services/game.js'

const router = Router()

// Create a new game session
router.post('/sessions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { characterKey } = req.body
    const userId = req.user!.id

    const character = getCharacter(characterKey)
    if (!character) {
      res.status(404).json({ success: false, error: 'Character not found' })
      return
    }

    const session = await prisma.gameSession.create({
      data: {
        userId,
        characterKey,
        gameState: {
          create: {
            affection: 0,
            trust: 0,
            mood: 'neutral',
            relationshipStage: 'stranger',
            triggeredEvents: '[]',
            playerChoices: '{}',
          },
        },
      },
      include: { gameState: true },
    })

    res.json({ success: true, data: session })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create session' })
  }
})

// Get user's sessions
router.get('/sessions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const sessions = await prisma.gameSession.findMany({
      where: { userId: req.user!.id },
      include: { gameState: true, _count: { select: { messages: true } } },
      orderBy: { updatedAt: 'desc' },
    })
    res.json({ success: true, data: sessions })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch sessions' })
  }
})

// Get session with messages
router.get('/sessions/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const session = await prisma.gameSession.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        gameState: true,
      },
    })
    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' })
      return
    }
    res.json({ success: true, data: session })
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch session' })
  }
})

export default router
