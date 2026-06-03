import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
async function main() {
  const groceries = await prisma.grocery.findMany();
  const missing = [];
  for (const g of groceries) {
    if (g.image && g.image.startsWith('/')) {
      const filePath = path.join(process.cwd(), 'public', g.image);
      if (!fs.existsSync(filePath)) {
        missing.push({ id: g.id, name: g.name, image: g.image });
      }
    }
  }
  console.log(JSON.stringify(missing, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
