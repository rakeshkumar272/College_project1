const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    where: { role: 'user' },
    take: 1
  });
  console.log("User:", users[0]);
  
  const groceries = await prisma.grocery.findMany({
    include: { variants: true },
    take: 1
  });
  console.dir(groceries, { depth: null });
}

check()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
