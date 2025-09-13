// src/lib/related.ts
// Pure scoring/filter helpers for "Related Listings" (no client JS)

/**
 * Data shape we rely on. Extra fields are allowed via index signature.
 */
export interface ListingData {
  availability?: string;            // e.g., "For Rent", "For Sale"
  location?: string;                // e.g., "Westlands, Nairobi"
  type?: string;                    // e.g., "Apartment", "House"
  bedrooms?: number;                // integer
  price?: number;                   // numeric (KES)
  amenities?: string[];             // list of strings
  neighborhoodHighlights?: string[];// optional synonyms:
  neighborhood?: string[];
  nearby?: string[];
  date?: number | string;           // sortable (optional)
  [k: string]: unknown;
}

export interface ListingEntry {
  slug: string;
  data: ListingData;
}

export interface ScoreWeights {
  location: number; // 40
  type: number;     // 20
  bedrooms: number; // 12
  price: number;    // 12
  amenities: number;// 10
  nearby: number;   // 6
}

export const DEFAULT_WEIGHTS: ScoreWeights = {
  location: 40,
  type: 20,
  bedrooms: 12,
  price: 12,
  amenities: 10,
  nearby: 6,
};

export interface RelatedOptions {
  /** Max items to return (default 4) */
  limit?: number;
  /**
   * Price tolerance:
   * - If `partialPriceScoring` is true, <= min → full, <= max → 75% weight, else 0.
   * - If `partialPriceScoring` is false, <= max → full, else 0.
   * Defaults: min=0.10 (10%), max=0.15 (15%).
   */
  priceToleranceMin?: number;
  priceToleranceMax?: number;
  partialPriceScoring?: boolean; // default true

  /** Use strict filter: same availability + same city/county (default true) */
  strictFilter?: boolean;

  /** Weights override (optional) */
  weights?: Partial<ScoreWeights>;

  /** Return per-candidate breakdown for debugging (default false) */
  withBreakdown?: boolean;
}

export interface ScoreBreakdown {
  total: number;
  parts: {
    location: number;
    type: number;
    bedrooms: number;
    price: number;
    amenities: number;
    nearby: number;
  };
}

/* ----------------------------- helpers ----------------------------- */

const norm = (s?: string) => (s || "").toLowerCase().trim();

const arr = <T>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);

const toLcSet = (xs: unknown[]) =>
  new Set(arr<string>(xs).map((v) => String(v).toLowerCase().trim()));

export function availabilityKey(s?: string): string {
  return norm(s).replace(/\s+/g, " "); // stable lower-case key
}

export function cityCountyTokens(location?: string): { city: string; county: string } {
  const raw = norm(location);
  if (!raw) return { city: "", county: "" };
  // Split on comma first; fallback split on " - "
  const parts = raw.split(",").map((x) => x.trim()).filter(Boolean);
  if (parts.length >= 2) return { city: parts[0], county: parts[1] };
  const dash = raw.split(" - ").map((x) => x.trim()).filter(Boolean);
  if (dash.length >= 2) return { city: dash[0], county: dash[1] };
  // Single token → treat as city only
  return { city: parts[0] || raw, county: "" };
}

export function sameCityOrCounty(a?: string, b?: string): boolean {
  const A = cityCountyTokens(a);
  const B = cityCountyTokens(b);
  return (A.city && A.city === B.city) || (A.county && A.county === B.county);
}

function bedroomsPart(cand?: number, cur?: number, weight = 12): number {
  if (typeof cand !== "number" || typeof cur !== "number") return 0;
  return Math.abs(cand - cur) <= 1 ? weight : 0;
}

function pricePart(
  cand?: number,
  cur?: number,
  weight = 12,
  tolMin = 0.10,
  tolMax = 0.15,
  partial = true
): number {
  if (typeof cand !== "number" || typeof cur !== "number" || cur <= 0) return 0;
  const diff = Math.abs(cand - cur) / cur;
  if (partial) {
    if (diff <= tolMin) return weight;           // within 10% → full
    if (diff <= tolMax) return Math.round(weight * 0.75); // 10–15% → partial
    return 0;
  }
  return diff <= tolMax ? weight : 0;
}

function amenitiesPart(cand: ListingData, cur: ListingData, weight = 10): number {
  const A = toLcSet(arr(cand.amenities));
  const B = toLcSet(arr(cur.amenities));
  let common = 0;
  B.forEach((v) => { if (A.has(v)) common++; });
  return common >= 2 ? weight : 0;
}

function nearbyPart(cand: ListingData, cur: ListingData, weight = 6): number {
  const cNear = toLcSet([
    ...arr(cand.neighborhoodHighlights),
    ...arr(cand.neighborhood),
    ...arr(cand.nearby),
  ]);
  const tNear = toLcSet([
    ...arr(cur.neighborhoodHighlights),
    ...arr(cur.neighborhood),
    ...arr(cur.nearby),
  ]);
  if (!cNear.size || !tNear.size) return 0;
  for (const v of tNear) if (cNear.has(v)) return weight; // any overlap
  return 0;
}

/* ----------------------------- scoring ----------------------------- */

export function scoreListing(
  candidate: ListingData,
  current: ListingData,
  options?: RelatedOptions
): ScoreBreakdown {
  const W = { ...DEFAULT_WEIGHTS, ...(options?.weights || {}) };

  const locationScore = sameCityOrCounty(candidate.location, current.location) ? W.location : 0;
  const typeScore =
    norm(candidate.type) && norm(candidate.type) === norm(current.type) ? W.type : 0;
  const bedroomsScore = bedroomsPart(candidate.bedrooms, current.bedrooms, W.bedrooms);
  const priceScore = pricePart(
    candidate.price,
    current.price,
    W.price,
    options?.priceToleranceMin ?? 0.10,
    options?.priceToleranceMax ?? 0.15,
    options?.partialPriceScoring ?? true
  );
  const amenitiesScore = amenitiesPart(candidate, current, W.amenities);
  const nearbyScore = nearbyPart(candidate, current, W.nearby);

  const total =
    locationScore + typeScore + bedroomsScore + priceScore + amenitiesScore + nearbyScore;

  return {
    total,
    parts: {
      location: locationScore,
      type: typeScore,
      bedrooms: bedroomsScore,
      price: priceScore,
      amenities: amenitiesScore,
      nearby: nearbyScore,
    },
  };
}

/* -------------------------- main API (pure) -------------------------- */

export interface RelatedResult {
  entry: ListingEntry;
  score: number;
  breakdown?: ScoreBreakdown;
}

/**
 * Pick related listings for a given listing.
 * - Strict filter (default): same availability + same city/county.
 * - Weighted ranking per spec; ties broken by more recent `date` (if present).
 */
export function pickRelated(
  current: ListingEntry,
  all: ListingEntry[],
  opts?: RelatedOptions
): RelatedResult[] {
  const {
    limit = 4,
    strictFilter = true,
    withBreakdown = false,
  } = opts || {};

  const curAvail = availabilityKey(current.data.availability);

  // Pre-filter pool
  const pool = all.filter((e) => {
    if (e.slug === current.slug) return false;
    const availOk = !strictFilter || availabilityKey(e.data.availability) === curAvail;
    const cityOk = !strictFilter || sameCityOrCounty(e.data.location, current.data.location);
    return availOk && cityOk;
  });

  // Score and rank
  const scored = pool
    .map((e) => {
      const breakdown = scoreListing(e.data, current.data, opts);
      return {
        entry: e,
        score: breakdown.total,
        breakdown: withBreakdown ? breakdown : undefined,
      } as RelatedResult;
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ad = Number(a.entry.data?.date || 0);
      const bd = Number(b.entry.data?.date || 0);
      return bd - ad;
    })
    .slice(0, limit);

  return scored;
}
