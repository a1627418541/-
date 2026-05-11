import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const characters = [
  {
    key: 'linxiaonuan',
    name: '林晓暖',
    prompt: '3D anime realistic style portrait of a gentle healing girl, short black hair, warm smile, wearing white nurse uniform, soft warm lighting, cream background, high quality, detailed face, beautiful eyes, 8k, masterpiece'
  },
  {
    key: 'guxingchen',
    name: '顾星辰',
    prompt: '3D anime realistic style portrait of a tsundere elegant young lady, refined makeup, wearing dark business suit, slightly chin up, confident cool expression, purple gradient background, high quality, detailed face, beautiful eyes, 8k, masterpiece'
  },
  {
    key: 'xiaxiaokui',
    name: '夏小葵',
    prompt: '3D anime realistic style portrait of an energetic sporty girl, high ponytail, wearing colorful sportswear, bright cheerful smile, sunlight outdoor background, high quality, detailed face, beautiful eyes, 8k, masterpiece'
  },
  {
    key: 'shenqiuqiu',
    name: '沈清秋',
    prompt: '3D anime realistic style portrait of an intellectual literary woman, wearing round glasses, long straight hair, holding a book, bookstore background with soft warm lighting, high quality, detailed face, beautiful eyes, 8k, masterpiece'
  },
  {
    key: 'sutong',
    name: '苏瞳',
    prompt: '3D anime realistic style portrait of a mysterious cat-like woman, lazy half-closed eyes, long black hair, wearing artistic dark clothes, artistic bokeh background, high quality, detailed face, beautiful eyes, 8k, masterpiece'
  }
]

function getPollinationsUrl(prompt, seed) {
  const encoded = encodeURIComponent(prompt)
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`
}

async function downloadImage(url, filepath) {
  console.log(`Downloading from: ${url.substring(0, 120)}...`)
  const res = await fetch(url, { timeout: 120000 })
  if (!res.ok) {
    throw new Error(`Failed to download image: HTTP ${res.status}`)
  }
  const buffer = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(filepath, buffer)
  console.log(`Saved ${buffer.length} bytes to ${filepath}`)
}

async function main() {
  const outputDir = path.join(__dirname, '..', 'public', 'avatars')
  fs.mkdirSync(outputDir, { recursive: true })

  for (const char of characters) {
    try {
      const url = getPollinationsUrl(char.prompt, 42)
      const filepath = path.join(outputDir, `${char.key}.png`)
      console.log(`\n[${char.name}] Generating avatar...`)
      await downloadImage(url, filepath)
    } catch (err) {
      console.error(`[${char.name}] FAILED:`, err.message)
    }

    // Delay between requests to avoid rate limiting
    await new Promise(r => setTimeout(r, 3000))
  }

  console.log('\nDone! Check public/avatars/ for generated images.')
}

main().catch(console.error)
