const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: { email: 'rockcreation101@gmail.com' },
    data: { role: 'admin' }
  });
  console.log("Updated user to admin:", user.email, user.role);
}

main().catch(console.error).finally(()=>prisma.$disconnect());
