const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const yogurts = await prisma.grocery.findMany({
    where: { name: { contains: 'yogurt', mode: 'insensitive' } },
    include: { variants: true }
  });
  console.dir(yogurts, { depth: null });
}

check()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
