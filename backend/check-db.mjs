import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const msgs = await prisma.chatMessage.findMany({
  orderBy: { createdAt: 'desc' },
  take: 5
});
msgs.forEach(m => {
  console.log(m.role, ':', m.content);
});
await prisma.$disconnect();
