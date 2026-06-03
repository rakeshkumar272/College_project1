const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const product = await prisma.grocery.updateMany({
    where: { name: 'Organic Whole Wheat Atta' },
    data: { image: '/images/fallback.png' } // Assuming no specific image exists, use fallback
  });
  console.log('Fixed atta image:', product.count);
}

main().catch(console.error).finally(()=>prisma.$disconnect());
