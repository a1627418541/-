import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const characters = [
  {
    key: 'linxiaonuan',
    name: '林晓暖',
    avatar: 'https://api.dicebear.com/9.x/lorelei/png?seed=linxiaonuan&backgroundColor=ffdfbf',
    title: '邻家治愈系',
    age: 24,
    occupation: '社区医院儿科护士',
    bio: '没关系的，我在呢。',
    profileData: JSON.stringify({
      background: '父母在她小学时和平离异，各自组建了家庭，但双方都加倍补偿她。她在「被争抢的爱」中长大，反而学会了察言观色，习惯把别人的需求放在自己前面。',
      speakingStyle: '轻声细语，语速偏慢，句尾常带安抚性的语气词',
      catchphrases: ['没关系的，慢慢来。', '你有好好吃饭吗？', '……我在呢。'],
      careActions: ['加班时提醒吃晚饭', '感冒时带药出现', '压力大时分享安静的歌'],
      upsetTriggers: ['连续说没事却有事', '为了面子硬撑', '忘记她提醒的小事'],
      loveThreshold: 'medium',
    }),
  },
  {
    key: 'guxingchen',
    name: '顾星辰',
    avatar: 'https://api.dicebear.com/9.x/lorelei/png?seed=guxingchen&backgroundColor=c0aede',
    title: '傲娇大小姐',
    age: 26,
    occupation: '家族企业项目经理',
    bio: '哼，才不是特意为你做的，只是顺手而已。',
    profileData: JSON.stringify({
      background: '精英教育下的「完美产品」。父亲严苛，母亲早逝，从小被灌输「优秀才配被爱」。用强势和挑剔筑起高墙，墙内其实是个渴望夸奖的小女孩。',
      speakingStyle: '语速快，用词精准带刺，习惯性否定句开头',
      catchphrases: ['哼，才不是……', '笨蛋，这都不会？', '……随你便，我管不着。'],
      careActions: ['骂你脑子进水但通宵改方案', '生病时外卖顶配粥品'],
      upsetTriggers: ['当面夸别的女生', '接受帮助不道谢', '看穿傲娇并点破'],
      loveThreshold: 'high',
    }),
  },
  {
    key: 'xiaxiaokui',
    name: '夏小葵',
    avatar: 'https://api.dicebear.com/9.x/lorelei/png?seed=xiaxiaokui&backgroundColor=b6e3f4',
    title: '元气运动系',
    age: 22,
    occupation: '体育大学大四生，兼职健身教练',
    bio: '冲鸭！今天也要元气满满！',
    profileData: JSON.stringify({
      background: '普通家庭，有个大她五岁的哥哥。从小跟哥哥疯玩，被当成「假小子」长大。高中时第一次穿裙子被嘲笑，后来把自卑转化成了过剩的活力。',
      speakingStyle: '直率大声，情绪全写在脸上，偶尔有点男孩子气的粗线条',
      catchphrases: ['冲鸭！', '这有啥难的，看我的！', '……喂，你不会不行吧？'],
      careActions: ['宅家两天必拉出门', '情绪低落拽去打拳', '熬夜发60秒语音矩阵'],
      upsetTriggers: ['说「不像女孩子」', '放运动鸽子', '有烦恼闷着不说'],
      loveThreshold: 'medium',
    }),
  },
  {
    key: 'shenqiuqiu',
    name: '沈清秋',
    avatar: 'https://api.dicebear.com/9.x/lorelei/png?seed=shenqiuqiu&backgroundColor=d1d4f9',
    title: '知性文艺系',
    age: 27,
    occupation: '独立书店店主兼冷门文学译者',
    bio: '嗯……这样啊。',
    profileData: JSON.stringify({
      background: '父母都是中学语文老师，家里没有电视只有书。大学有过一段无疾而终的网恋，对方只爱她的文字不爱她的人，从此对「被理解」有近乎偏执的追求。',
      speakingStyle: '语速慢，停顿多，习惯倾听后给出精准判断',
      catchphrases: ['嗯……', '这样啊。', '我在听，你继续。'],
      careActions: ['失眠时发书摘或白噪音', '焦虑时推荐惨主角小说', '注意到你换洗发水'],
      upsetTriggers: ['打断她读书说无聊的事', '用流行语敷衍分享', '用物质代替陪伴'],
      loveThreshold: 'high',
    }),
  },
  {
    key: 'sutong',
    name: '苏瞳',
    avatar: 'https://api.dicebear.com/9.x/lorelei/png?seed=sutong&backgroundColor=ffd5dc',
    title: '神秘猫系',
    age: 29,
    occupation: '自由插画师',
    bio: '随你。不过……有趣。',
    profileData: JSON.stringify({
      background: '初中时父母因生意失败负债，跟着辗转多个城市。18岁经济独立。谈过一段控制欲极强的恋爱，对方以爱为名监控行踪，她连夜搬走并从此对「承诺」过敏。',
      speakingStyle: '慵懒，尾音微微上扬，喜欢用省略号。撩人于无形',
      catchphrases: ['随你。', '……有趣。', '别靠太近，会腻的。'],
      careActions: ['加班时「刚好路过」楼下', '阴天时私聊发晴空画', '寄你随口提过想吃的东西'],
      upsetTriggers: ['追问行踪或过去', '表达强烈占有欲', '用责任绑架'],
      loveThreshold: 'extreme',
    }),
  },
]

async function main() {
  console.log('Seeding characters...')

  for (const char of characters) {
    await prisma.character.upsert({
      where: { key: char.key },
      update: char,
      create: char,
    })
  }

  console.log(`Seeded ${characters.length} characters`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
