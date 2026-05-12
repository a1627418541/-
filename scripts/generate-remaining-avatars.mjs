import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
const API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
const MODEL = 'qwen-image-2.0-pro'

const characters = [
  {
    key: 'xiaxiaokui',
    name: '夏小葵',
    prompt: '日系动漫3D写实风格头像，元气运动系中国年轻女孩，高马尾辫，穿着运动服，灿烂阳光的笑容，户外阳光背景，精致五官，美丽眼睛，杰作，8k'
  },
  {
    key: 'shenqiuqiu',
    name: '沈清秋',
    prompt: '日系动漫3D写实风格头像，知性文艺系中国年轻女性，戴眼镜，长发，在书店中，柔和光线，安静气质，精致五官，美丽眼睛，杰作，8k'
  },
  {
    key: 'sutong',
    name: '苏瞳',
    prompt: '日系动漫3D写实风格头像，神秘猫系中国年轻女性，慵懒半眯眼，黑色长发，艺术感背景，黑色系穿搭，精致五官，美丽眼睛，杰作，8k，电影感打光'
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
        messages: [{ role: 'user', content: [{ text: prompt }] }],
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
    throw new Error('No image URL in response')
  }
  return imageUrl
}

async function downloadImage(url, filepath) {
  console.log(`Downloading from: ${url.substring(0, 100)}...`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(filepath, buffer)
  console.log(`Saved ${buffer.length} bytes`)
}

async function main() {
  const outputDir = path.join(__dirname, '..', 'public', 'avatars')
  fs.mkdirSync(outputDir, { recursive: true })

  for (const char of characters) {
    try {
      console.log(`\n[${char.name}] Generating...`)
      const imageUrl = await generateImage(char.prompt)
      const filepath = path.join(outputDir, `${char.key}.png`)
      await downloadImage(imageUrl, filepath)
      console.log(`[${char.name}] Success!`)
    } catch (err) {
      console.error(`[${char.name}] FAILED:`, err.message)
    }
    await new Promise(r => setTimeout(r, 10000))
  }
  console.log('\nDone!')
}

main().catch(console.error)
