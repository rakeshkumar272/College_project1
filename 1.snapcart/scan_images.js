const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const prisma = new PrismaClient();

function checkUrl(url) {
  return new Promise((resolve) => {
    if (!url || typeof url !== 'string') return resolve(false);
    if (!url.startsWith('http')) return resolve(false);
    
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function main() {
  const products = await prisma.grocery.findMany();

  let totalScanned = 0;
  let validImages = 0;
  let brokenImages = 0;
  const brokenList = [];

  for (const product of products) {
    totalScanned++;
    const img = product.image;
    
    let isWorking = false;
    
    if (!img) {
      // No image
    } else if (img.startsWith('http')) {
      isWorking = await checkUrl(img);
    } else {
      // Local path
      const localPath = path.join(__dirname, 'public', img.startsWith('/') ? img : `/${img}`);
      isWorking = fs.existsSync(localPath);
    }
    
    if (isWorking) {
      validImages++;
    } else {
      brokenImages++;
      brokenList.push({
        id: product.id,
        name: product.name,
        image: img || 'NULL'
      });
    }
  }

  console.log(`Total Scanned (Products): ${totalScanned}`);
  console.log(`Valid Images: ${validImages}`);
  console.log(`Broken Images: ${brokenImages}`);
  console.log('Broken List:', JSON.stringify(brokenList, null, 2));
}

main().catch(console.error).finally(()=>prisma.$disconnect());
