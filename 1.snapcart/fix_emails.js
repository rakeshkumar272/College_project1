const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  for (const u of users) {
    if (u.email === 'sapnakumar246@gmail.com' || u.email === 'syedsameer7866380@gmail.com') {
      const newEmail = `test_${u.id}@rockcreation101.com`;
      console.log(`Update user ${u.email}`);
    }
  }
}

main().then(()=>prisma.$disconnect());
