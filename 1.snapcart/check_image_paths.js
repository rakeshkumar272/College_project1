const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.grocery.findMany({
    select: { id: true, name: true, image: true }
  });
  console.log(products.slice(0, 10)); // Just 10 samples
}

main().catch(console.error).finally(()=>prisma.$disconnect());
