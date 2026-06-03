const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const groceries = await prisma.grocery.findMany({
    select: { id: true, name: true }
  });
  console.dir(groceries, { depth: null });
}

check()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
