const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const products = await prisma.grocery.findMany({
    where: { name: { contains: 'yogurt', mode: 'insensitive' } },
    include: { variants: true }
  });
  console.dir(products, { depth: null });
}

check()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
