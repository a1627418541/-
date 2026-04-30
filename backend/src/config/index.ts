import dotenv from 'dotenv'
import { resolve } from 'path'

// Load .env from project root (parent of backend/)
dotenv.config({ path: resolve(process.cwd(), '..', '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '..', '.env') })

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',

  // AI Configuration (Kimi / Doubao)
  // Supports Cloudflare AI Gateway by setting AI_BASE_URL to your gateway endpoint
  aiProvider: process.env.AI_PROVIDER || 'kimi', // 'kimi' | 'doubao'
  aiApiKey: process.env.AI_API_KEY || '',
  aiBaseUrl: process.env.AI_BASE_URL || '', // e.g. https://gateway.cloudflare.ai/...
  aiModel: process.env.AI_MODEL || 'moonshot-v1-128k',
  aiTemperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),

  // Legacy Kimi configs (backward compat)
  kimiApiKey: process.env.KIMI_API_KEY || '',
  kimiBaseUrl: process.env.KIMI_API_BASE || 'https://api.moonshot.cn/v1',
  kimiModel: process.env.KIMI_MODEL || 'moonshot-v1-128k',

  // Crisp (frontend injects this)
  crispWebsiteId: process.env.CRISP_WEBSITE_ID || '',
} as const