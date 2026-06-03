const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: 'rockcreation101@gmail.com' } });
  const syed = await prisma.user.findUnique({ where: { email: 'syedsameer7866380@gmail.com' } });

  if (admin && syed) {
    // 1. Change admin email to temporary
    await prisma.user.update({
      where: { id: admin.id },
      data: { email: 'temp_admin@gmail.com' }
    });

    // 2. Change syed email to rockcreation101
    await prisma.user.update({
      where: { id: syed.id },
      data: { email: 'rockcreation101@gmail.com' }
    });

    // 3. Change admin email to syed
    await prisma.user.update({
      where: { id: admin.id },
      data: { email: 'syedsameer7866380@gmail.com' }
    });

    console.log('Successfully swapped emails! The order now belongs to rockcreation101@gmail.com.');
  } else {
    console.log('Users not found');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
