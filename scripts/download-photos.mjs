import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')

const characters = [
  {
    key: 'linxiaonuan',
    name: '林晓暖',
    photos: [
      { id: 'warm_selfie', prompt: 'anime style portrait of a gentle young Chinese woman with short brown hair, warm smile, wearing white sweater, soft warm lighting, cozy indoor background, high quality anime illustration', seed: 1001 },
      { id: 'nurse_duty', prompt: 'anime style illustration of a gentle young Chinese female nurse in white uniform, pediatric hospital ward, soft sunlight through window, caring expression, high quality anime art', seed: 1002 },
      { id: 'cooking', prompt: 'anime style illustration of a gentle young Chinese woman cooking soup in kitchen, warm lighting, two bowls on table, domestic cozy scene, high quality anime art', seed: 1003 },
      { id: 'sunset_walk', prompt: 'anime style illustration of a gentle young Chinese woman walking at sunset, holding a warm drink, back view silhouette, golden hour lighting, peaceful park scene', seed: 1004 },
    ],
  },
  {
    key: 'guxingchen',
    name: '顾星辰',
    photos: [
      { id: 'office_cool', prompt: 'anime style portrait of an elegant young Chinese woman with long black hair, professional business suit, cold confident expression, modern office background, high quality anime illustration', seed: 2001 },
      { id: 'mirror_selfie', prompt: 'anime style illustration of an elegant young Chinese woman taking mirror selfie, stylish outfit, slightly blushing ears, luxurious room background, high quality anime art', seed: 2002 },
      { id: 'gift_prep', prompt: 'anime style illustration of an elegant young Chinese woman secretly preparing a wrapped gift on desk, pretending not to care, soft indoor lighting, high quality anime art', seed: 2003 },
      { id: 'soft_moment', prompt: 'anime style illustration of an elegant young Chinese woman looking out window with vulnerable soft expression, evening light, emotional quiet moment, high quality anime art', seed: 2004 },
    ],
  },
  {
    key: 'xiaxiaokui',
    name: '夏小葵',
    photos: [
      { id: 'gym_selfie', prompt: 'anime style portrait of an energetic young Chinese woman with ponytail, sportswear, bright cheerful smile, gym background, vibrant colors, high quality anime illustration', seed: 3001 },
      { id: 'sunny_smile', prompt: 'anime style illustration of an energetic young Chinese woman with ponytail, sports tank top and shorts, bright sunny outdoor, big smile, high quality anime art', seed: 3002 },
      { id: 'post_workout', prompt: 'anime style illustration of an energetic young Chinese woman after workout, slightly sweaty, giving victory sign, gym locker room, high quality anime art', seed: 3003 },
      { id: 'hiking', prompt: 'anime style illustration of an energetic young Chinese woman on mountain peak, arms spread wide, sunrise background, achievement pose, high quality anime art', seed: 3004 },
    ],
  },
  {
    key: 'shenqiuqiu',
    name: '沈清秋',
    photos: [
      { id: 'bookstore', prompt: 'anime style illustration of a refined young Chinese woman with long dark hair and glasses, standing between bookshelves holding a book, bookstore atmosphere, soft lighting, high quality anime art', seed: 4001 },
      { id: 'coffee_reading', prompt: 'anime style illustration of a refined young Chinese woman with glasses reading at cafe corner, coffee cup on table, afternoon light, quiet peaceful scene, high quality anime art', seed: 4002 },
      { id: 'window_writing', prompt: 'anime style illustration of a refined young Chinese woman writing by window, side profile, sunlight highlighting face, book and pen, contemplative mood, high quality anime art', seed: 4003 },
      { id: 'gentle_smile', prompt: 'anime style portrait of a refined young Chinese woman with glasses and long dark hair, rare gentle smile looking at camera, soft indoor lighting, high quality anime illustration', seed: 4004 },
    ],
  },
  {
    key: 'sutong',
    name: '苏瞳',
    photos: [
      { id: 'art_studio', prompt: 'anime style illustration of a mysterious young Chinese woman with long black hair, painting in art studio, paint on fingertips, focused side profile, creative atmosphere, high quality anime art', seed: 5001 },
      { id: 'lazy_selfie', prompt: 'anime style portrait of a mysterious young Chinese woman with long black hair, lazy half-closed eyes expression, casual home setting, cat-like vibe, high quality anime illustration', seed: 5002 },
      { id: 'night_city', prompt: 'anime style illustration of a mysterious young Chinese woman with long black hair standing on rooftop at night, city lights background, wind blowing hair, contemplative mood, high quality anime art', seed: 5003 },
      { id: 'cat_together', prompt: 'anime style illustration of a mysterious young Chinese woman with long black hair holding a black cat, subtle smile, cozy indoor setting, warm lighting, high quality anime art', seed: 5004 },
    ],
  },
]

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
  const baseUrl = 'https://image.pollinations.ai/prompt'

  for (const char of characters) {
    const dir = path.join(rootDir, 'public', 'photos', char.key)
    fs.mkdirSync(dir, { recursive: true })
    console.log(`\nDownloading ${char.name} photos...`)

    for (const photo of char.photos) {
      const encodedPrompt = encodeURIComponent(photo.prompt)
      const url = `${baseUrl}/${encodedPrompt}?seed=${photo.seed}&width=512&height=768&nologo=true&enhance=true`
      const dest = path.join(dir, `${photo.id}.png`)

      // Skip if already exists
      if (fs.existsSync(dest)) {
        const size = fs.statSync(dest).size
        console.log(`  ${photo.id}: already exists (${size} bytes)`)
        continue
      }

      try {
        const bytes = await downloadPhoto(url, dest)
        console.log(`  ${photo.id}: downloaded ${bytes} bytes`)
      } catch (err) {
        console.error(`  ${photo.id}: FAILED - ${err.message}`)
      }

      // Small delay between requests
      await new Promise(r => setTimeout(r, 800))
    }
  }

  console.log('\nAll done!')
}

main().catch(console.error)
