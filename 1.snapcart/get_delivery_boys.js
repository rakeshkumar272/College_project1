const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const deliveryBoys = await prisma.user.findMany({
    where: { role: 'deliveryBoy' }
  });

  const defaultPassword = 'password123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  console.log('--- Delivery Boys ---');
  for (const boy of deliveryBoys) {
    await prisma.user.update({
      where: { id: boy.id },
      data: { password: hashedPassword }
    });
    console.log(`Email: ${boy.email}`);
    console.log(`Password: ${defaultPassword}`);
    console.log('-------------------');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
