const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orderItems = await prisma.orderItem.findMany();
  let brokenCount = 0;
  for (const item of orderItems) {
    if (!item.image) {
       console.log("Missing image for order item: ", item.name);
       brokenCount++;
    }
  }
  console.log("Total broken order items: ", brokenCount);
}

main().catch(console.error).finally(()=>prisma.$disconnect());
