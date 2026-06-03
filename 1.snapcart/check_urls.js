const { PrismaClient } = require('@prisma/client');
const https = require('https');
const http = require('http');

const prisma = new PrismaClient();

function checkUrl(url) {
  return new Promise((resolve) => {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return resolve(true);
    
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    }).on('error', () => {
      resolve(false);
    });
    
    // Add a timeout
    req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
    });
  });
}

async function main() {
  const products = await prisma.grocery.findMany();
  let brokenCount = 0;
  for (const product of products) {
    if (product.image && product.image.startsWith('http')) {
      const isValid = await checkUrl(product.image);
      if (!isValid) {
        console.log(`BROKEN: ${product.name} -> ${product.image}`);
        brokenCount++;
      }
    }
  }
  console.log(`Total broken external images: ${brokenCount}`);
}

main().catch(console.error).finally(()=>prisma.$disconnect());
