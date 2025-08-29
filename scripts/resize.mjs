import { globby } from 'globby';
import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import path from 'path';

const SRC_DIR = 'public/images/properties/luxury-4br-villa-in-karen';
const OUT_DIR = 'public/images/derived';
await mkdir(OUT_DIR, { recursive: true });

const files = await globby([`${SRC_DIR}/*.webp`]);

const jobs = [];
for (const f of files) {
  const base = path.parse(f).name;
  jobs.push(sharp(f).resize(1600, 900, { fit: 'cover' }).toFile(`${OUT_DIR}/${base}-hero.webp`));
  jobs.push(sharp(f).resize(800, 533, { fit: 'cover' }).toFile(`${OUT_DIR}/${base}-card.webp`));
  jobs.push(sharp(f).resize(1200, 630, { fit: 'cover' }).toFile(`${OUT_DIR}/${base}-blog.webp`));
}
await Promise.all(jobs);
console.log(`Resized ${files.length} images into ${OUT_DIR}`);
