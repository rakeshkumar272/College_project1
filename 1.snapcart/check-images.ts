import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const groceries = await prisma.grocery.findMany();
  console.log(JSON.stringify(groceries.map(g => ({id: g.id, name: g.name, image: g.image})), null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
