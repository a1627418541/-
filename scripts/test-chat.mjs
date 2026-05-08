// Test script: create random accounts, chat with random characters, verify DB
const BASE = 'http://localhost:3001/api'

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}) },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

const characters = ['linxiaonuan', 'guxingchen', 'xiaxiaokui', 'shenqiuqiu', 'sutong']
const chatTopics = [
  '你好呀，今天过得怎么样？',
  '在干嘛呢？',
  '能给我发张照片吗？',
  '你最近忙什么呢？',
  '我想看看你',
  '你今天吃了什么？',
  '有空一起出去走走吗？',
  '你穿护士服的样子一定很好看',
]
const photoRequests = [
  '能给我发张照片吗？',
  '我想看看你最近的照片',
  '发张自拍给我吧',
  '有没有你的照片呀',
]

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function run() {
  console.log('=== 测试开始 ===\n')

  // Create 3 random users
  for (let i = 1; i <= 3; i++) {
    const email = `test${Date.now()}${i}@example.com`
    const password = 'test123456'
    const nickname = ` tester${i}`

    // Register
    console.log(`[用户${i}] 注册: ${email}`)
    let r = await api('/auth/register', { method: 'POST', body: { email, password, nickname } })
    if (!r.ok) {
      console.log('  注册失败:', r.data.error || r.status)
      continue
    }
    console.log('  注册成功')

    // Login
    r = await api('/auth/login', { method: 'POST', body: { email, password } })
    if (!r.ok) {
      console.log('  登录失败:', r.data.error || r.status)
      continue
    }
    const token = r.data.data.token
    console.log('  登录成功, token 获取成功')

    // Random character
    const charKey = rand(characters)
    console.log(`  选择角色: ${charKey}`)

    // Create session
    r = await api('/game/sessions', { method: 'POST', token, body: { characterKey: charKey } })
    if (!r.ok) {
      console.log('  创建会话失败:', r.data.error || r.status)
      continue
    }
    const sessionId = r.data.data.id
    console.log('  会话创建成功:', sessionId)

    // Send messages
    const msgCount = randInt(3, 6)
    console.log(`  发送 ${msgCount} 条消息...`)

    for (let j = 0; j < msgCount; j++) {
      const content = j === 2 ? rand(photoRequests) : rand(chatTopics)
      console.log(`    [${j + 1}] 发送: "${content}"`)

      r = await api('/chat/send', { method: 'POST', token, body: { sessionId, content } })
      if (!r.ok) {
        console.log('      发送失败:', r.data.error || r.status)
        continue
      }

      const messages = r.data.data.messages || [r.data.data.message]
      messages.forEach(m => {
        if (m.messageType === 'image') {
          console.log(`      → AI 发送了照片: ${m.imageUrl}`)
        } else {
          console.log(`      → AI 回复: "${m.content.slice(0, 60)}${m.content.length > 60 ? '...' : ''}"`)
        }
      })
    }

    console.log('')
  }

  console.log('=== 测试完成 ===')
}

run().catch(err => {
  console.error('测试出错:', err)
  process.exit(1)
})
