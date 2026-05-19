import type { CharacterProfile } from '@/types'

/**
 * Game State Service - handles affection/mood calculations
 */
export interface GameStateSnapshot {
  affection: number
  trust: number
  mood: string
  relationshipStage: string
  triggeredEvents: string[]
  playerChoices: Record<string, string>
}

const STAGE_THRESHOLDS = [
  { stage: 'stranger', min: -100 },
  { stage: 'acquaintance', min: -20 },
  { stage: 'friend', min: 10 },
  { stage: 'close', min: 40 },
  { stage: 'lover', min: 70 },
]

export function calculateRelationshipStage(affection: number): string {
  for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (affection >= STAGE_THRESHOLDS[i].min) {
      return STAGE_THRESHOLDS[i].stage
    }
  }
  return 'stranger'
}

/**
 * Analyze player message to determine affection/trust changes
 * This is a simplified version - in production, this could use AI or more complex rules
 */
export function analyzeMessageImpact(
  message: string,
  character: CharacterProfile,
  currentState: GameStateSnapshot
): { affectionDelta: number; trustDelta: number; moodChange: string | null } {
  const lowerMsg = message.toLowerCase()
  let affectionDelta = 0
  let trustDelta = 0
  let moodChange: string | null = null

  // Positive signals
  const positivePatterns = [
    '谢谢', '感谢', '辛苦了', '晚安', '早安',
    '想你', '喜欢你', '好看', '厉害', '棒',
    '对不起', '抱歉', '我的错',
  ]

  // Negative signals
  const negativePatterns = [
    '烦', '滚', '闭嘴', '别管', '无聊',
    '随便', '都行', '无所谓',
  ]

  // Check for character-specific care recognition
  const careKeywords = ['关心', '记得', '温暖', '贴心', '感动']
  const upsetKeywords = character.upsetTriggers.map(t => t.slice(0, 4)) // rough match

  for (const pattern of positivePatterns) {
    if (lowerMsg.includes(pattern)) {
      affectionDelta += 1
      trustDelta += 0.5
    }
  }

  for (const pattern of negativePatterns) {
    if (lowerMsg.includes(pattern)) {
      affectionDelta -= 2
      trustDelta -= 1
    }
  }

  for (const keyword of careKeywords) {
    if (lowerMsg.includes(keyword)) {
      affectionDelta += 2
      trustDelta += 1
    }
  }

  // Deep sharing increases trust significantly
  if (message.length > 50 && (lowerMsg.includes('我') || lowerMsg.includes('感觉'))) {
    trustDelta += 2
  }

  // Flirting
  if (lowerMsg.includes('想你') || lowerMsg.includes('喜欢') || lowerMsg.includes('爱')) {
    affectionDelta += 3
    if (currentState.relationshipStage === 'close') {
      moodChange = 'excited'
    }
  }

  // Check if player hit an upset trigger
  for (const trigger of character.upsetTriggers) {
    const triggerWords = trigger.replace(/[「」]/g, '').split(/，|、|；/)
    for (const word of triggerWords) {
      if (word.length > 2 && lowerMsg.includes(word.toLowerCase())) {
        affectionDelta -= 3
        trustDelta -= 2
        moodChange = 'sad'
        break
      }
    }
  }

  // Clamp values
  affectionDelta = Math.max(-5, Math.min(5, affectionDelta))
  trustDelta = Math.max(-3, Math.min(3, trustDelta))

  return { affectionDelta, trustDelta, moodChange }
}

/**
 * Check if any story event should trigger
 */
export function checkEventTriggers(
  state: GameStateSnapshot,
  character: CharacterProfile
): string | null {
  // Example events - can be expanded
  if (!state.triggeredEvents.includes('first_care') && state.affection > 5) {
    return 'first_care'
  }
  if (!state.triggeredEvents.includes('deep_talk') && state.trust > 15) {
    return 'deep_talk'
  }
  if (!state.triggeredEvents.includes('confession') && state.affection > 75) {
    return 'confession'
  }
  return null
}
