const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.groupBy({
    by: ['status'],
    _count: { _all: true }
  });
  console.log(orders);
}

main().then(()=>prisma.$disconnect());
