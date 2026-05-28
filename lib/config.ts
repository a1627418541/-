export const config = {
  databaseUrl: process.env.DATABASE_URL || '',

  aiProvider: process.env.AI_PROVIDER || 'kimi',
  aiApiKey: process.env.AI_API_KEY || '',
  aiBaseUrl: process.env.AI_BASE_URL || '',
  aiModel: process.env.AI_MODEL || 'moonshot-v1-128k',
  aiTemperature: parseFloat(process.env.AI_TEMPERATURE || '0.92'),

  kimiApiKey: process.env.KIMI_API_KEY || '',
  kimiBaseUrl: process.env.KIMI_API_BASE || 'https://api.moonshot.cn/v1',
  kimiModel: process.env.KIMI_MODEL || 'moonshot-v1-128k',

  crispWebsiteId: process.env.CRISP_WEBSITE_ID || '',

  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY || '',
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',

  dashscopeApiKey: process.env.DASHSCOPE_API_KEY || '',
  dashscopeImageModel: process.env.DASHSCOPE_IMAGE_MODEL || 'wanx2.1-t2i-turbo',

  r2Endpoint: process.env.R2_ENDPOINT || '',
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  r2BucketName: process.env.R2_BUCKET_NAME || '',
  r2PublicUrl: process.env.R2_PUBLIC_URL || '',

  resendApiKey: process.env.RESEND_API_KEY || '',
  cronSecret: process.env.CRON_SECRET || '',

  betterAuthSecret: process.env.BETTER_AUTH_SECRET || '',
  betterAuthUrl: process.env.BETTER_AUTH_URL || '',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
} as const
