import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
loadEnv(path.join(__dirname, '..', 'backend', '.env'))

// 从环境变量读取配置
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
const API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
const MODEL = 'qwen-image-2.0-pro'

const characters = [
  {
    key: 'linxiaonuan',
    name: '林晓暖',
    prompt: '日系动漫3D写实风格头像，温柔治愈系中国年轻女孩，短发，穿着白色毛衣，温暖的微笑，暖色调室内背景，精致五官，美丽眼睛，杰作，8k，柔光',
  },
  {
    key: 'guxingchen',
    name: '顾星辰',
    prompt: '日系动漫3D写实风格头像，傲娇大小姐气质的中国年轻女性，精致妆容，穿着时尚职业套装，微抬下巴的高冷表情，冷色调现代办公室背景，精致五官，美丽眼睛，杰作，8k',
  },
  {
    key: 'xiaxiaokui',
    name: '夏小葵',
    prompt: '日系动漫3D写实风格头像，元气运动系中国年轻女孩，高马尾辫，穿着运动服，灿烂阳光的笑容，户外阳光背景，精致五官，美丽眼睛，杰作，8k',
  },
  {
    key: 'shenqiuqiu',
    name: '沈清秋',
    prompt: '日系动漫3D写实风格头像，知性文艺系中国年轻女性，戴眼镜，长发，在书店中，柔和光线，安静气质，精致五官，美丽眼睛，杰作，8k',
  },
  {
    key: 'sutong',
    name: '苏瞳',
    prompt: '日系动漫3D写实风格头像，神秘猫系中国年轻女性，慵懒半眯眼，黑色长发，艺术感背景，黑色系穿搭，精致五官，美丽眼睛，杰作，8k，电影感打光',
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

  // 提取图片URL
  const imageUrl = data.output?.choices?.[0]?.message?.content?.[0]?.image
  if (!imageUrl) {
    console.error('Response:', JSON.stringify(data, null, 2))
    throw new Error('No image URL in response')
  }

  return imageUrl
}

async function downloadImage(url, filepath) {
  console.log(`Downloading from: ${url.substring(0, 100)}...`)
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to download image: HTTP ${res.status}`)
  }
  const buffer = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(filepath, buffer)
  console.log(`Saved ${buffer.length} bytes to ${filepath}`)
}

async function main() {
  if (!DASHSCOPE_API_KEY) {
    console.error('Error: DASHSCOPE_API_KEY environment variable is required')
    console.error('请在 .env 文件中设置 DASHSCOPE_API_KEY，或运行时传入:')
    console.error('  DASHSCOPE_API_KEY=sk-xxxxx node scripts/generate-avatars-qwen.mjs')
    process.exit(1)
  }

  const outputDir = path.join(__dirname, '..', 'public', 'avatars')
  fs.mkdirSync(outputDir, { recursive: true })

  for (const char of characters) {
    try {
      console.log(`\n[${char.name}] Generating avatar with Qwen-Image...`)
      const imageUrl = await generateImage(char.prompt)
      const filepath = path.join(outputDir, `${char.key}.png`)
      await downloadImage(imageUrl, filepath)
      console.log(`[${char.name}] Success!`)
    } catch (err) {
      console.error(`[${char.name}] FAILED:`, err.message)
    }

    // 请求间隔，避免触发限流
    await new Promise(r => setTimeout(r, 3000))
  }

  console.log('\nDone! Check public/avatars/ for generated images.')
}

main().catch(console.error)
