import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')

// 自动加载 backend/.env
function loadEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.substring(0, idx).trim()
    const value = trimmed.substring(idx + 1).trim()
    if (key && value) process.env[key] = value
  }
}
loadEnv(path.join(rootDir, 'backend', '.env'))

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
const API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
const MODEL = 'qwen-image-2.0-pro'

const characters = [
  {
    key: 'linxiaonuan',
    name: '林晓暖',
    photos: [
      { id: 'warm_selfie', prompt: '日系动漫风格，温柔的中国年轻女孩，棕色短发，温暖微笑，穿白色毛衣，柔和暖光，温馨室内背景，高质量插画' },
      { id: 'nurse_duty', prompt: '日系动漫风格，温柔的中国女护士，白色护士服，儿科病房，窗外柔和阳光，关怀的表情，高质量插画' },
      { id: 'cooking', prompt: '日系动漫风格，温柔的中国年轻女孩在厨房煮汤，温暖灯光，桌上两副碗筷，温馨家庭场景，高质量插画' },
      { id: 'sunset_walk', prompt: '日系动漫风格，温柔的中国年轻女孩傍晚散步，手持热饮，背影剪影，金色夕阳，宁静公园，高质量插画' },
    ],
  },
  {
    key: 'guxingchen',
    name: '顾星辰',
    photos: [
      { id: 'office_cool', prompt: '日系动漫风格，优雅的中国年轻女性，黑色长发，职业套装，高冷自信表情，现代办公室背景，高质量插画' },
      { id: 'mirror_selfie', prompt: '日系动漫风格，优雅的中国年轻女性对镜自拍，精致穿搭，耳尖微红，奢华房间背景，高质量插画' },
      { id: 'gift_prep', prompt: '日系动漫风格，优雅的中国年轻女性在桌上偷偷准备包装精美的礼物，假装不在意，柔和室内灯光，高质量插画' },
      { id: 'soft_moment', prompt: '日系动漫风格，优雅的中国年轻女性靠在窗边，卸下防备的脆弱柔软表情，黄昏光线，情感静谧时刻，高质量插画' },
    ],
  },
  {
    key: 'xiaxiaokui',
    name: '夏小葵',
    photos: [
      { id: 'gym_selfie', prompt: '日系动漫风格，活力的中国年轻女孩，高马尾，运动服，灿烂笑容，健身房背景，鲜艳色彩，高质量插画' },
      { id: 'sunny_smile', prompt: '日系动漫风格，活力的中国年轻女孩，运动背心和短裤，明亮户外阳光，大大笑容，高质量插画' },
      { id: 'post_workout', prompt: '日系动漫风格，活力的中国年轻女孩运动后，微汗，比胜利手势，健身房更衣室，高质量插画' },
      { id: 'hiking', prompt: '日系动漫风格，活力的中国年轻女孩站在山顶，双臂张开，日出背景，成就感姿势，高质量插画' },
    ],
  },
  {
    key: 'shenqiuqiu',
    name: '沈清秋',
    photos: [
      { id: 'bookstore', prompt: '日系动漫风格，知性的中国年轻女性，深色长发戴眼镜，站在书架间手持一本书，书店氛围，柔和灯光，高质量插画' },
      { id: 'coffee_reading', prompt: '日系动漫风格，知性的中国年轻女性戴眼镜在咖啡馆角落阅读，桌上咖啡杯，午后光线，宁静平和场景，高质量插画' },
      { id: 'window_writing', prompt: '日系动漫风格，知性的中国年轻女性在窗边写作，侧脸轮廓，阳光勾勒面部轮廓，书和笔，沉思氛围，高质量插画' },
      { id: 'gentle_smile', prompt: '日系动漫风格，知性的中国年轻女性，戴眼镜深色长发，罕见的温柔微笑看向镜头，柔和室内灯光，高质量插画' },
    ],
  },
  {
    key: 'sutong',
    name: '苏瞳',
    photos: [
      { id: 'art_studio', prompt: '日系动漫风格，神秘的中国年轻女性，黑色长发，在画室作画，指尖沾颜料，专注侧脸，创作氛围，高质量插画' },
      { id: 'lazy_selfie', prompt: '日系动漫风格，神秘的中国年轻女性，黑色长发，慵懒半眯眼表情，休闲居家环境，猫系气质，高质量插画' },
      { id: 'night_city', prompt: '日系动漫风格，神秘的中国年轻女性，黑色长发，夜晚城市天台背影，城市灯光背景，风吹长发，沉思氛围，高质量插画' },
      { id: 'cat_together', prompt: '日系动漫风格，神秘的中国年轻女性，黑色长发，抱着一只黑猫，嘴角隐约微笑，温馨室内环境，暖光，高质量插画' },
    ],
  },
]

async function generateImage(prompt) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      input: {
        messages: [
          {
            role: 'user',
            content: [{ text: prompt }],
          },
        ],
      },
      parameters: {
        size: '1024*1024',
        watermark: false,
        prompt_extend: true,
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }

  const data = await res.json()
  const imageUrl = data.output?.choices?.[0]?.message?.content?.[0]?.image
  if (!imageUrl) {
    console.error('Response:', JSON.stringify(data, null, 2))
    throw new Error('No image URL in response')
  }

  return imageUrl
}

async function downloadPhoto(url, destPath) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`)
  }
  const buffer = await res.arrayBuffer()
  fs.writeFileSync(destPath, Buffer.from(buffer))
  return buffer.byteLength
}

async function main() {
  if (!DASHSCOPE_API_KEY) {
    console.error('Error: DASHSCOPE_API_KEY environment variable is required')
    console.error('请在 .env 文件中设置 DASHSCOPE_API_KEY，或运行时传入:')
    console.error('  DASHSCOPE_API_KEY=sk-xxxxx node scripts/generate-photos-qwen.mjs')
    process.exit(1)
  }

  for (const char of characters) {
    const dir = path.join(rootDir, 'public', 'photos', char.key)
    fs.mkdirSync(dir, { recursive: true })
    console.log(`\nGenerating ${char.name} photos with Qwen-Image...`)

    for (const photo of char.photos) {
      const dest = path.join(dir, `${photo.id}.png`)

      // 如果已存在则跳过
      if (fs.existsSync(dest)) {
        const size = fs.statSync(dest).size
        console.log(`  ${photo.id}: already exists (${size} bytes)`)
        continue
      }

      try {
        console.log(`  ${photo.id}: generating...`)
        const imageUrl = await generateImage(photo.prompt)
        const bytes = await downloadPhoto(imageUrl, dest)
        console.log(`  ${photo.id}: downloaded ${bytes} bytes`)
      } catch (err) {
        console.error(`  ${photo.id}: FAILED - ${err.message}`)
      }

      // 请求间隔，避免触发限流
      await new Promise(r => setTimeout(r, 3000))
    }
  }

  console.log('\nAll done!')
}

main().catch(console.error)
