import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";

export const LISTING_TYPES = ["sale", "rent", "short-stays"] as const;
export type ListingType = typeof LISTING_TYPES[number];

type ListingMeta = {
  file: string;
  slug: string;
  address: string;
  availability: ListingType | null;
};

const BASE = "src/content/listings";

function normalizeAvailability(v: unknown): ListingType | null {
  const s = String(v ?? "").toLowerCase().replace(/[_\s]/g, "-");
  if (["shortstays", "short-stay", "short-stays", "short-term", "short-let", "short-lets"].includes(s)) return "short-stays";
  if (["rent", "rental", "for-rent"].includes(s)) return "rent";
  if (["sale", "for-sale"].includes(s)) return "sale";
  return null;
}

export async function loadListingMeta(baseDir = BASE): Promise<ListingMeta[]> {
  const files = await fg("**/*.md", { cwd: baseDir, absolute: true });
  return files.map((abs) => {
    const raw = fs.readFileSync(abs, "utf8");
    const fm = matter(raw).data as Record<string, unknown>;
    const slug = String(fm.slug ?? path.basename(abs).replace(/\.md$/, "").toLowerCase());
    const address = String(fm.address ?? "").trim();
    const availability = normalizeAvailability(fm.availability);
    return {
      file: abs,
      slug,
      address,
      availability
    };
  });
}

export async function validateListings(baseDir = BASE) {
  const meta = await loadListingMeta(baseDir);

  const empties: ListingMeta[] = [];
  const comboMap = new Map<string, ListingMeta[]>();
  const slugMap = new Map<string, ListingMeta[]>();

  for (const m of meta) {
    const bad =
      !m.slug ||
      !m.address ||
      !m.availability ||
      !LISTING_TYPES.includes(m.availability);

    if (bad) empties.push(m);

    // composite key: slug + address + availability
    const comboKey = `${m.slug}|${m.address}|${m.availability ?? "?"}`;
    const arr = comboMap.get(comboKey) ?? [];
    arr.push(m);
    comboMap.set(comboKey, arr);

    // pure slug key
    const sArr = slugMap.get(m.slug) ?? [];
    sArr.push(m);
    slugMap.set(m.slug, sArr);
  }

  const duplicates: { key: string; files: string[] }[] = [];
  for (const [k, arr] of comboMap) {
    if (arr.length > 1) duplicates.push({ key: k, files: arr.map((x) => x.file) });
  }

  const slugDuplicates: { slug: string; files: string[] }[] = [];
  for (const [slug, arr] of slugMap) {
    if (arr.length > 1) slugDuplicates.push({ slug, files: arr.map((x) => x.file) });
  }

  // emit report
  const outDir = path.join("dist", "validation");
  fs.mkdirSync(outDir, { recursive: true });
  const report = {
    scanned: meta.length,
    duplicates,       // duplicate composite keys
    slugDuplicates,   // duplicate slugs across the collection
    empties: empties.map((e) => ({
      file: e.file,
      slug: e.slug,
      address: e.address,
      availability: e.availability
    })),
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(
    path.join(outDir, "listings-conflicts.json"),
    JSON.stringify(report, null, 2)
  );

  const dupCount = duplicates.length;
  const slugDupCount = slugDuplicates.length;
  const emptyCount = empties.length;

  if (dupCount || slugDupCount || emptyCount) {
    const msg = `Validation failed: ${dupCount} duplicate composite keys, ${slugDupCount} duplicate slugs, ${emptyCount} empty/invalid listings. See dist/validation/listings-conflicts.json`;
    throw new Error(msg);
  }
}

/** URL param helpers for /listings?... */
export function getTypeFromURL(searchParams: URLSearchParams): ListingType | null {
  // Prefer ?type=
  const primary = normalizeAvailability(searchParams.get("type"));
  if (primary && LISTING_TYPES.includes(primary)) return primary;

  // Fallback to legacy ?availability= (e.g., for-rent, for-sale)
  const fallback = normalizeAvailability(searchParams.get("availability"));
  return fallback && LISTING_TYPES.includes(fallback) ? fallback : null;
}

export function setTypeInURL(type: ListingType) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("type", type);
  // Clean up legacy/conflicting param if present
  if (url.searchParams.has("availability")) url.searchParams.delete("availability");
  history.replaceState(null, "", url.toString());
}
