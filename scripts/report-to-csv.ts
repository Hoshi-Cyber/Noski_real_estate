import fs from "node:fs";
import path from "node:path";

const inFile = "dist/validation/listings-conflicts.json";
const outFile = "dist/validation/listings-conflicts.csv";

const raw = fs.readFileSync(inFile, "utf8");
const data = JSON.parse(raw) as {
  scanned: number;
  duplicates: { key: string; files: string[] }[];
  empties: { file: string; slug: string; address: string; availability: string }[];
  generatedAt: string;
};

const rows: string[] = [];
rows.push(["issue_type","file","slug","address","availability","dup_key"].join(","));

for (const e of data.empties) {
  rows.push(["empty_or_invalid", e.file, e.slug ?? "", e.address ?? "", e.availability ?? "", ""]
    .map(v => `"${String(v).replace(/"/g,'""')}"`).join(","));
}
for (const d of data.duplicates) {
  for (const f of d.files) {
    rows.push(["duplicate", f, "", "", "", d.key].map(v => `"${String(v).replace(/"/g,'""')}"`).join(","));
  }
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, rows.join("\n"));
console.log(`Wrote ${outFile}`);
