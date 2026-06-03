const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { user: true }
  });

  for (const order of orders) {
    console.log(`Order ID: ${order.id}, User Email: ${order.user.email}, Status: ${order.status}, OTP: ${order.deliveryOtp}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
