const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('t13592$M', 10);
  
  const user = await prisma.user.update({
    where: { email: 'rockcreation101@gmail.com' },
    data: { password: hashedPassword }
  });
  
  console.log(`Updated password for ${user.email} successfully.`);
}

main().catch(console.error).finally(()=>prisma.$disconnect());
