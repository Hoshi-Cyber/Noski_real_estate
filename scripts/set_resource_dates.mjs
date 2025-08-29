import { readdir, readFile, writeFile, stat } from 'fs/promises';
import path from 'path';

const DIR = 'src/content/resources';

const iso = (d) => d.toISOString().slice(0,10); // YYYY-MM-DD

const files = (await readdir(DIR))
  .filter(f => f.endsWith('.md'))
  .map(f => path.join(DIR, f));

const withMtime = await Promise.all(files.map(async f => {
  const s = await stat(f);
  return { file: f, mtime: s.mtimeMs };
}));

// Newest first
withMtime.sort((a,b) => b.mtime - a.mtime);

const today = new Date();
for (let i = 0; i < withMtime.length; i++) {
  const f = withMtime[i].file;
  const d = new Date(today); d.setDate(today.getDate() - i);
  const newDate = iso(d);

  let txt = await readFile(f, 'utf8');

  // Ensure frontmatter exists
  if (!txt.startsWith('---')) {
    txt = `---\npubDate: ${newDate}\n---\n` + txt;
  } else {
    // Replace existing pubDate OR insert it before closing ---
    const fmEnd = txt.indexOf('\n---', 3);
    const fm = txt.slice(0, fmEnd + 4);
    const rest = txt.slice(fmEnd + 4);
    let newFm;
    if (/^\s*pubDate\s*:/m.test(fm)) {
      newFm = fm.replace(/^\s*pubDate\s*:\s*.*$/m, `pubDate: ${newDate}`);
    } else {
      newFm = fm.replace(/^---\s*\n/, `---\npubDate: ${newDate}\n`);
    }
    txt = newFm + rest;
  }

  await writeFile(f, txt, 'utf8');
  console.log(`Updated ${path.basename(f)} -> pubDate: ${newDate}`);
}
console.log('Done.');