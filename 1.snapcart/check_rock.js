const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'rockcreation101@gmail.com' }
  });
  console.log("User:", user);
}

main().then(()=>prisma.$disconnect());
