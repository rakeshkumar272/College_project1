const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'rockcreation101@gmail.com' },
  });
  console.log('User found:', user);
  if (user) {
    const updated = await prisma.user.update({
      where: { email: 'rockcreation101@gmail.com' },
      data: { role: 'admin' }
    });
    console.log('User role updated to admin:', updated);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
