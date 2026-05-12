// 测试千问万相生图 API
import fs from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 手动加载 backend/.env
function loadEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.substring(0, idx).trim()
    const value = trimmed.substring(idx + 1).trim()
    if (key && value) {
      process.env[key] = value
    }
  }
}

loadEnv(resolve(__dirname, '../backend/.env'))

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
const API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
const MODEL = 'qwen-image-2.0-pro'

async function testGenerateImage() {
  if (!DASHSCOPE_API_KEY) {
    console.error('❌ DASHSCOPE_API_KEY 未设置')
    process.exit(1)
  }

  console.log('🎨 测试千问万相生图 API...')
  console.log('API Key:', DASHSCOPE_API_KEY.substring(0, 15) + '...')
  console.log('模型:', MODEL)
  console.log('')

  const prompt = '日系动漫3D写实风格头像，温柔的中国年轻女孩，短发，微笑，暖色调背景'

  console.log('提示词:', prompt)
  console.log('正在请求 API...')

  const startTime = Date.now()

  try {
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

    const elapsed = Date.now() - startTime
    console.log(`\n✅ HTTP 状态码: ${res.status} (${elapsed}ms)`)

    if (!res.ok) {
      const text = await res.text()
      console.error('❌ 请求失败:', text)
      process.exit(1)
    }

    const data = await res.json()
    console.log('\n📦 响应结构:')
    console.log(JSON.stringify(data, null, 2).substring(0, 500) + '...')

    const imageUrl = data.output?.choices?.[0]?.message?.content?.[0]?.image

    if (!imageUrl) {
      console.error('\n❌ 响应中没有图片 URL')
      console.error('完整响应:', JSON.stringify(data, null, 2))
      process.exit(1)
    }

    console.log('\n✅ 成功获取图片 URL!')
    console.log('URL:', imageUrl.substring(0, 80) + '...')

    // 下载图片
    console.log('\n📥 下载图片中...')
    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) {
      console.error('❌ 下载失败:', imgRes.status)
      process.exit(1)
    }

    const buffer = Buffer.from(await imgRes.arrayBuffer())
    console.log(`✅ 下载完成: ${buffer.length} bytes`)

    // 保存到临时目录
    const outputDir = resolve(__dirname, '../public/avatars')
    fs.mkdirSync(outputDir, { recursive: true })

    const outputPath = resolve(outputDir, 'test-qwen.png')
    fs.writeFileSync(outputPath, buffer)
    console.log(`💾 已保存: ${outputPath}`)
    console.log('\n🎉 千问万相生图 API 测试通过!')

  } catch (err) {
    console.error('\n❌ 错误:', err.message)
    console.error(err.stack)
    process.exit(1)
  }
}

testGenerateImage()
