const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: { in: ['admin', 'deliveryBoy'] } },
    select: { id: true, email: true, name: true, role: true, password: true, status: true }
  });
  console.log(users);
}

main().then(()=>prisma.$disconnect());
