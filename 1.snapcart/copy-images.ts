import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const artifactDir = 'C:\\Users\\Rakesh Kumar\\.gemini\\antigravity\\brain\\34954c85-b684-4ba2-89cd-6728ac315761';
const targetDir = path.join(process.cwd(), 'public', 'images');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const mapping = {
  '/images/garam_masala.jpg': 'garam_masala',
  '/images/turmeric_powder.jpg': 'turmeric_powder',
  '/images/red_chilli_powder.jpg': 'red_chilli_powder',
  '/images/red_apple.png': 'red_apple',
  '/images/coriander_powder.png': 'coriander_powder',
  '/images/fresh_cream.png': 'fresh_cream',
  '/images/mixed_spices.png': 'mixed_spices',
  '/images/broccoli.png': 'broccoli',
  '/images/strawberries.png': 'strawberries',
  '/images/blueberries.png': 'blueberries',
  '/images/green_grapes.png': 'green_grapes',
  '/images/mango_lassi.jpg': 'mango_lassi',
  '/images/salted_cashews.png': 'salted_cashews',
  '/images/nacho_chips.png': 'nacho_chips',
  '/images/banana_chips.png': 'banana_chips',
  '/images/butter_popcorn.png': 'butter_popcorn',
  '/images/basmati_rice.png': 'basmati_rice'
};

const failedGeneration = {
  '/images/wheat_atta.png': 'Organic Whole Wheat Atta',
  '/images/rolled_oats.png': 'Premium Rolled Oats',
  '/images/moong_dal.png': 'Organic Moong Dal',
  '/images/fresh_ginger.jpg': 'Fresh Ginger'
};

async function main() {
  const files = fs.readdirSync(artifactDir);
  
  for (const [dbPath, prefix] of Object.entries(mapping)) {
    const filename = files.find(f => f.startsWith(prefix + '_') && f.endsWith('.png'));
    if (filename) {
      const source = path.join(artifactDir, filename);
      const dest = path.join(process.cwd(), 'public', dbPath);
      // Ensure subdirectories exist
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(source, dest);
      console.log(`Copied ${filename} to ${dbPath}`);
    } else {
      console.log(`Could not find artifact for ${prefix}`);
    }
  }

  // Use generic unsplash images for the ones that failed to generate
  const unsplashLinks = [
    'https://images.unsplash.com/photo-1596649280963-333e655938f3?w=500&q=80', // Ginger/spice
    'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&q=80', // Oats/Grain
    'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=500&q=80', // Dal
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80'  // Atta
  ];

  let i = 0;
  for (const [dbPath, name] of Object.entries(failedGeneration)) {
      const item = await prisma.grocery.findFirst({ where: { name: name } });
      if (item) {
          await prisma.grocery.update({
              where: { id: item.id },
              data: { image: unsplashLinks[i % unsplashLinks.length] }
          });
          console.log(`Updated DB for ${name}`);
      }
      i++;
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
