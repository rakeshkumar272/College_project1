const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      role: 'user'
    }
  });

  console.log(`Found ${users.length} users. Updating their email to rockcreation101@gmail.com`);

  for (const u of users) {
    if (u.email !== 'rockcreation101@gmail.com') {
      try {
        await prisma.user.update({
          where: { id: u.id },
          data: { email: 'rockcreation101@gmail.com' }
        });
        console.log(`Updated user ${u.id} (${u.name})`);
      } catch (err) {
        // Might fail due to unique constraint if another user already has the email.
        console.log(`Failed to update ${u.id}: ${err.message}`);
      }
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
