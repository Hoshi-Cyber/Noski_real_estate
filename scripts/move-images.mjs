#!/usr/bin/env node
/**
 * Move property images from /public/images/properties/** to /public/images/listings/**
 * Rename 1.webp → main.webp
 * Usage:
 *   node scripts/move-images.mjs --dry-run
 *   node scripts/move-images.mjs --execute
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const PROPERTIES_DIR = path.join(ROOT_DIR, 'public', 'images', 'properties');
const LISTINGS_DIR = path.join(ROOT_DIR, 'public', 'images', 'listings');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isExecute = args.includes('--execute');

if (!isDryRun && !isExecute) {
  console.error('❌ Please specify either --dry-run or --execute');
  process.exit(1);
}

if (!fs.existsSync(PROPERTIES_DIR)) {
  console.error(`❌ Properties folder not found: ${PROPERTIES_DIR}`);
  process.exit(1);
}

if (!fs.existsSync(LISTINGS_DIR)) {
  if (isExecute) {
    fs.mkdirSync(LISTINGS_DIR, { recursive: true });
    console.log(`📁 Created: ${LISTINGS_DIR}`);
  } else {
    console.log(`(dry-run) Would create: ${LISTINGS_DIR}`);
  }
}

let missingMain = [];

function moveAndRenameFolder(srcFolder, destFolder) {
  if (!fs.existsSync(destFolder)) {
    if (isExecute) {
      fs.mkdirSync(destFolder, { recursive: true });
    }
  }

  const files = fs.readdirSync(srcFolder);
  let hasMain = false;

  for (const file of files) {
    const srcPath = path.join(srcFolder, file);
    let destPath = path.join(destFolder, file);

    if (file.toLowerCase() === '1.webp') {
      destPath = path.join(destFolder, 'main.webp');
      hasMain = true;
    }

    if (isExecute) {
      fs.renameSync(srcPath, destPath);
    } else {
      console.log(`(dry-run) Would move: ${srcPath} → ${destPath}`);
    }
  }

  if (!hasMain) {
    missingMain.push(destFolder);
  }
}

const folders = fs.readdirSync(PROPERTIES_DIR);

for (const folder of folders) {
  const srcPath = path.join(PROPERTIES_DIR, folder);
  const destPath = path.join(LISTINGS_DIR, folder);

  if (fs.lstatSync(srcPath).isDirectory()) {
    moveAndRenameFolder(srcPath, destPath);
  }
}

if (missingMain.length) {
  console.warn(`⚠️ Missing main.webp in ${missingMain.length} folders:`);
  missingMain.forEach(f => console.warn(` - ${f}`));
}

if (isExecute) {
  // Remove empty properties folder
  fs.rmSync(PROPERTIES_DIR, { recursive: true, force: true });
  console.log(`🗑️ Deleted empty folder: ${PROPERTIES_DIR}`);
}

console.log(`✅ Migration ${isDryRun ? 'dry-run completed' : 'completed'}`);
