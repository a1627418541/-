import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const avatars: Record<string, string> = {
  linxiaonuan: '/avatars/linxiaonuan.png',
  guxingchen: '/avatars/guxingchen.png',
  xiaxiaokui: '/avatars/xiaxiaokui.png',
  shenqiuqiu: '/avatars/shenqiuqiu.png',
  sutong: '/avatars/sutong.png',
}

async function main() {
  for (const [key, avatar] of Object.entries(avatars)) {
    const result = await prisma.character.updateMany({
      where: { key },
      data: { avatar }
    })
    console.log('Updated', key, ':', result.count, 'rows')
  }

  const chars = await prisma.character.findMany()
  chars.forEach(c => console.log('DB:', c.key, c.avatar))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
