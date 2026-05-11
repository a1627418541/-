import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const characters = [
  {
    key: 'xiaxiaokui',
    name: '夏小葵',
    prompt: 'Japanese anime 3D realistic style portrait, young human girl, high ponytail, wearing sporty tracksuit, bright cheerful smile, outdoor sunlight background, detailed face, beautiful eyes, masterpiece, 8k, soft lighting'
  },
  {
    key: 'sutong',
    name: '苏瞳',
    prompt: 'Japanese anime 3D realistic style portrait, mysterious elegant human woman, lazy half-closed eyes, long straight black hair, wearing dark artistic dress, night city bokeh background, detailed face, beautiful eyes, masterpiece, 8k, cinematic lighting, fully human, no animal ears'
  }
]

function getPollinationsUrl(prompt, seed) {
  const encoded = encodeURIComponent(prompt)
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`
}

async function downloadImage(url, filepath) {
  console.log(`Downloading from: ${url.substring(0, 120)}...`)
  const res = await fetch(url)
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
      const url = getPollinationsUrl(char.prompt, 88)
      const filepath = path.join(outputDir, `${char.key}.png`)
      console.log(`\n[${char.name}] Generating avatar...`)
      await downloadImage(url, filepath)
    } catch (err) {
      console.error(`[${char.name}] FAILED:`, err.message)
    }

    await new Promise(r => setTimeout(r, 3000))
  }

  console.log('\nDone! Check public/avatars/ for generated images.')
}

main().catch(console.error)
