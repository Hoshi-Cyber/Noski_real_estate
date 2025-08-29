// src/lib/search.ts

import { moneyToNumber } from "./utils";

// Accept what Astro typically passes (Astro.url) and also raw query strings
type SearchParamsInput = URL | URLSearchParams | string;

function getParams(input: SearchParamsInput): URLSearchParams {
  if (input instanceof URL) return input.searchParams;
  if (input instanceof URLSearchParams) return input;
  // string like "?q=..." or "q=..."
  return new URLSearchParams(input.startsWith("?") ? input.slice(1) : input);
}

export function parseSearchParams(input: SearchParamsInput) {
  const params = getParams(input);

  const availability = coerceAvailability(params.get("availability") || params.get("serviceType") || "");
  const q = (params.get("q") || "").trim().toLowerCase();

  let minPrice = moneyToNumber(params.get("minPrice") || "");
  let maxPrice = moneyToNumber(params.get("maxPrice") || "");

  const bedsStr = params.get("beds") || params.get("bedrooms") || "";
  const beds = coerceBeds(bedsStr);

  const page = Math.max(parseInt(params.get("page") || "1", 10), 1);

  // Swap if min > max
  if (minPrice && maxPrice && minPrice > maxPrice) {
    const tmp = minPrice;
    minPrice = maxPrice;
    maxPrice = tmp;
  }

  return { page, availability, q, minPrice, maxPrice, beds };
}

/**
 * Filter a list of "listings" collection entries using the
 * object returned by parseSearchParams.
 *
 * Each item is expected to look like: { data: { ...fields } }
 */
export function filterListings(listings: any[], filters: ReturnType<typeof parseSearchParams>) {
  const norm = (s: string = "") => s.toLowerCase().replace(/\s+/g, "-");

  return listings.filter((item) => {
    const d = (item && item.data) || {};

    // availability
    if (filters.availability) {
      const avail = norm(String(d.availability || ""));
      if (avail !== filters.availability) return false;
    }

    // query across common fields
    if (filters.q) {
      const haystack = `${d.title || ""} ${d.location || ""} ${d.description || ""}`.toLowerCase();
      if (!haystack.includes(filters.q)) return false;
    }

    // price (treat non-numeric as missing)
    const priceVal =
      typeof d.price === "number" ? d.price : moneyToNumber(d.price ?? "");

    if (filters.minPrice != null && filters.minPrice !== 0) {
      if (typeof priceVal !== "number" || priceVal < filters.minPrice) return false;
    }
    if (filters.maxPrice != null && filters.maxPrice !== 0) {
      if (typeof priceVal !== "number" || priceVal > filters.maxPrice) return false;
    }

    // bedrooms (minimum)
    if (filters.beds) {
      const need = parseInt(filters.beds, 10);
      const have = Number(d.bedrooms) || 0;
      if (have < need) return false;
    }

    return true;
  });
}

// -------- helpers --------
function coerceAvailability(val: string) {
  const v = (val || "").toLowerCase().replace(/\s+/g, "-");
  const allowed = ["for-sale", "for-rent", "short-stays"];
  return allowed.includes(v) ? v : "";
}

function coerceBeds(val: string) {
  if (!val) return "";
  const n = parseInt(val, 10);
  return Number.isNaN(n) ? "" : String(n);
}
