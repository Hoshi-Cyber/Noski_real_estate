// scripts/distribute_images.mjs
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'public', 'images', 'source');           // house_*.*
const DEST_ROOT = path.join(ROOT, 'public', 'images', 'properties');     // one folder per listing
const IMAGES_PER_FOLDER = 6;

// discover source images
const sourceFiles = (fs.existsSync(SRC_DIR) ? fs.readdirSync(SRC_DIR) : [])
  .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
  .sort((a,b) => {
    const na = parseInt((a.match(/\d+/) || [0])[0], 10);
    const nb = parseInt((b.match(/\d+/) || [0])[0], 10);
    return na - nb || a.localeCompare(b);
  });

if (sourceFiles.length === 0) {
  console.error(`No source images found in ${SRC_DIR}. Put house_1..house_N here.`);
  process.exit(1);
}

// discover property folders
const propFolders = fs.readdirSync(DEST_ROOT)
  .map(name => path.join(DEST_ROOT, name))
  .filter(p => fs.statSync(p).isDirectory())
  .sort((a,b) => path.basename(a).localeCompare(path.basename(b)));

if (propFolders.length === 0) {
  console.error(`No property folders found in ${DEST_ROOT}.`);
  process.exit(1);
}

console.log(`Distributing ${sourceFiles.length} images across ${propFolders.length} property folders …`);

let srcIdx = 0;
for (const folder of propFolders) {
  // ensure folder exists
  fs.mkdirSync(folder, { recursive: true });

  // write 1.webp … 6.webp
  for (let i = 1; i <= IMAGES_PER_FOLDER; i++) {
    const fileName = sourceFiles[srcIdx % sourceFiles.length];
    const inPath = path.join(SRC_DIR, fileName);
    const outPath = path.join(folder, `${i}.webp`);

    // convert -> webp, reasonable quality
    await sharp(inPath)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(outPath);

    srcIdx++;
  }

  console.log(`✓ ${path.basename(folder)} ← assigned ${IMAGES_PER_FOLDER} images`);
}

console.log('Done. Each listing folder now has 1.webp … 6.webp.');
