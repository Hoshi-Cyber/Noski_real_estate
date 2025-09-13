import fs from "node:fs";
import fg from "fast-glob";
import matter from "gray-matter";

const reportPath = "dist/validation/listings-conflicts.json";
const BASE = "src/content/listings";

type SlugDup = { slug: string; files: string[] };
type Report = { slugDuplicates?: SlugDup[] };

if (!fs.existsSync(reportPath)) {
  console.error("Report missing. Run `npm run validate:listings` first.");
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8")) as Report;
const groups = report.slugDuplicates ?? [];
if (!groups.length) {
  console.log("No duplicate slugs in report.");
  process.exit(0);
}

// Build a set of all current slugs across the collection to avoid re-collisions.
const filesAll = fg.sync("**/*.md", { cwd: BASE, absolute: true });
const existingSlugs = new Set<string>();
for (const f of filesAll) {
  const raw = fs.readFileSync(f, "utf8");
  const doc = matter(raw);
  const slug = String(doc.data.slug ?? f.replace(/^.*[\\/]/, "").replace(/\.md$/,"").toLowerCase());
  existingSlugs.add(slug);
}

let edits = 0;

for (const grp of groups) {
  const files = grp.files;
  // keep the first file's slug as-is; fix the rest
  for (let i = 1; i < files.length; i++) {
    const f = files[i];
    const raw = fs.readFileSync(f, "utf8");
    const doc = matter(raw);
    const fm = { ...doc.data };

    const base = String(fm.slug ?? f.replace(/^.*[\\/]/, "").replace(/\.md$/,"")).toLowerCase().trim() || "listing";
    let n = 2;
    let candidate = `${base}-${n}`;
    while (existingSlugs.has(candidate)) {
      n++;
      candidate = `${base}-${n}`;
    }

    fm.slug = candidate;
    fs.writeFileSync(f, matter.stringify(doc.content, fm));
    existingSlugs.add(candidate);
    console.log(`Deduped slug: ${f} -> "${candidate}"`);
    edits++;
  }
}

console.log(`Duplicate slugs fixed: ${edits}`);
