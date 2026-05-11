import dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

// Load .env from project root (parent of backend/)
// In production (Render/Railway), env vars are injected directly
// In local dev, load from .env files
const __dirname = fileURLToPath(new URL('.', import.meta.url))
dotenv.config({ path: resolve(__dirname, '../../.env.local') })
dotenv.config({ path: resolve(__dirname, '../../.env') })

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',

  // AI Configuration (Kimi / Doubao)
  aiProvider: process.env.AI_PROVIDER || 'kimi',
  aiApiKey: process.env.AI_API_KEY || '',
  aiBaseUrl: process.env.AI_BASE_URL || '',
  aiModel: process.env.AI_MODEL || 'moonshot-v1-128k',
  aiTemperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),

  // Legacy Kimi configs
  kimiApiKey: process.env.KIMI_API_KEY || '',
  kimiBaseUrl: process.env.KIMI_API_BASE || 'https://api.moonshot.cn/v1',
  kimiModel: process.env.KIMI_MODEL || 'moonshot-v1-128k',

  // Crisp
  crispWebsiteId: process.env.CRISP_WEBSITE_ID || '',
} as const
