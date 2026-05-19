import { aiService } from './ai'
import { getCharacter } from './character'

/**
 * Love Letter Service
 * Generates a daily love letter for a user based on their active character.
 */

export interface LoveLetterResult {
  subject: string
  content: string
}

/**
 * Generate a daily love letter for a character
 */
export async function generateDailyLoveLetter(
  characterKey: string,
  relationshipStage: string = 'stranger',
  affection: number = 0
): Promise<LoveLetterResult> {
  const character = getCharacter(characterKey)
  if (!character) {
    throw new Error(`Unknown character: ${characterKey}`)
  }

  const stageDescriptions: Record<string, string> = {
    stranger: '你们刚认识不久',
    acquaintance: '你们已经有些熟悉',
    friend: '你们是好朋友',
    close: '你们很亲近',
    lover: '你们是恋人',
  }

  const systemPrompt = `你正在扮演一个真实的中国年轻女性：${character.name}。

【角色信息】
年龄：${character.age}岁
职业：${character.occupation}
性格：${character.title}

【说话风格】
${character.speakingStyle}
口头禅：${character.catchphrases.join('、')}

【当前关系】
${stageDescriptions[relationshipStage] || stageDescriptions.stranger}
好感度：${affection}

【任务】
请写一封简短的情话/心情便签（50-150字），发给对方。要求：
1. 保持角色性格，不要OOC
2. 像真实恋爱中的女生写的，自然、真诚
3. 可以结合当前关系阶段调整亲密程度
4. 不要签名，不要写"爱你的XXX"
5. 简短，像一条长微信消息
6. 只返回信件正文，不要任何其他内容`

  const content = await aiService.chatCompletion(
    [{ role: 'user', content: '写一封今日的情话便签' }],
    systemPrompt
  )

  const trimmed = content.trim()

  // Generate a subject line based on the content
  const subjectPrompt = `请为下面这段话起一个简短的邮件标题（10字以内），像恋爱中女生会起的标题：\n\n${trimmed}\n\n只返回标题文字，不要引号。`

  let subject = await aiService.chatCompletion(
    [{ role: 'user', content: subjectPrompt }]
  )

  subject = subject.trim().replace(/[""]/g, '').slice(0, 20)
  if (!subject) {
    subject = `${character.name}想对你说`
  }

  return { subject, content: trimmed }
}
