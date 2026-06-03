const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('t13592$M', 10);
  const updated = await prisma.user.update({
    where: { email: 'rockcreation101@gmail.com' },
    data: { password: hashedPassword, role: 'admin' }
  });
  console.log('Password and role updated successfully for admin:', updated.email);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
