import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashed = await bcrypt.hash('123456', 10)
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: { email: 'test@example.com', password: hashed, nickname: 'TestUser' }
  })
  console.log('Created/updated user:', user.id, user.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
