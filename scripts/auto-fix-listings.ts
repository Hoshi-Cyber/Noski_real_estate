import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";

const BASE = "src/content/listings";
const LISTING_TYPES = ["sale","rent","short-stays"] as const;
type ListingType = typeof LISTING_TYPES[number];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/(^-|-$)/g,"");
}

function normalizeAvailability(v: unknown): ListingType | null {
  const s = String(v ?? "").toLowerCase().replace(/[_\s]/g,"-");
  if (["sale","for-sale","sales"].includes(s)) return "sale";
  if (["rent","rental","for-rent","lets","let"].includes(s)) return "rent";
  if (["shortstays","short-stay","short-stays","short-term","short-lets","shortlet"].includes(s)) return "short-stays";
  return null;
}

function inferAvailabilityFromPath(abs: string): ListingType | null {
  const p = abs.toLowerCase();
  if (p.includes("/rent/") || p.endsWith("/rent.md")) return "rent";
  if (p.includes("/sale/") || p.endsWith("/sale.md")) return "sale";
  if (p.includes("short") || p.includes("stay")) return "short-stays";
  return null;
}

function pickAddress(fm: Record<string, any>): string {
  return String(
    fm.address ??
    fm.location ??
    fm.neighborhood ??
    fm.estate ??
    fm.area ??
    ""
  ).trim();
}

(async () => {
  const files = await fg("**/*.md", { cwd: BASE, absolute: true });
  let changed = 0;
  const unresolved: { file: string; missing: string[] }[] = [];

  for (const abs of files) {
    const raw = fs.readFileSync(abs, "utf8");
    const doc = matter(raw);
    const fm: Record<string, any> = { ...doc.data };

    const missing: string[] = [];

    // slug
    if (!fm.slug || String(fm.slug).trim() === "") {
      const fromTitle = fm.title ? String(fm.title) : path.basename(abs).replace(/\.md$/,"");
      fm.slug = slugify(fromTitle);
      changed++;
    }

    // availability
    let avail = normalizeAvailability(fm.availability);
    if (!avail) {
      avail = inferAvailabilityFromPath(abs) || null;
      if (avail) {
        fm.availability = avail;
        changed++;
      }
    } else {
      fm.availability = avail;
    }
    if (!fm.availability) missing.push("availability");

    // address
    if (!fm.address || String(fm.address).trim() === "") {
      const guess = pickAddress(fm);
      if (guess) {
        fm.address = guess;
        changed++;
      } else {
        missing.push("address");
      }
    }

    // record unresolved
    if (missing.length) {
      unresolved.push({ file: abs, missing });
    }

    // write back only if we changed something
    const newRaw = matter.stringify(doc.content, fm);
    if (newRaw !== raw) fs.writeFileSync(abs, newRaw);
  }

  // summary
  console.log(`Auto-fix complete. Files changed: ${changed}.`);
  if (unresolved.length) {
    const out = path.join("dist","validation","unresolved-manual-fixes.csv");
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const rows = ["file,missing_fields"];
    for (const u of unresolved) {
      rows.push(`"${u.file.replace(/"/g,'""')}","${u.missing.join("|")}"`);
    }
    fs.writeFileSync(out, rows.join("\n"));
    console.log(`Manual fixes required: ${unresolved.length}. See ${out}`);
  } else {
    console.log("No manual fixes remaining.");
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
