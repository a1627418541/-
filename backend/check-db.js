const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const msgs = await prisma.chatMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  msgs.forEach(m => {
    console.log(m.role, ':', m.content);
  });
  await prisma.$disconnect();
}
main().catch(console.error);
