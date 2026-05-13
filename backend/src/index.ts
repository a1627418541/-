import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load env from project root
const rootDir = resolve(process.cwd(), '..')
dotenv.config({ path: resolve(rootDir, '.env.local') })
dotenv.config({ path: resolve(rootDir, '.env') })

import { config } from './config/index.js'
import authRoutes from './routes/auth.js'
import characterRoutes from './routes/character.js'
import gameRoutes from './routes/game.js'
import chatRoutes from './routes/chat.js'
import imageRoutes from './routes/image.js'

const app = express()

app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/characters', characterRoutes)
app.use('/api/game', gameRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/images', imageRoutes)

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`)
  console.log(`AI Provider: ${config.aiProvider}`)
  console.log(`AI Base URL: ${config.aiBaseUrl || config.kimiBaseUrl || '(not set)'}`)
  console.log(`AI Model: ${config.aiModel || config.kimiModel || '(not set)'}`)
  console.log(`AI API Key: ${config.aiApiKey ? 'configured' : 'NOT CONFIGURED'}`)
  console.log(`Image Gen: ${config.dashscopeApiKey ? 'configured (' + config.dashscopeImageModel + ')' : 'NOT CONFIGURED'}`)
  console.log(`R2 Storage: ${config.r2Endpoint ? 'configured (' + config.r2BucketName + ')' : 'NOT CONFIGURED (using local filesystem)'}`)
  console.log(`JWT Secret: ${config.jwtSecret === 'your-secret-key-change-in-production' ? 'WARNING - using default' : 'configured'}`)
})
