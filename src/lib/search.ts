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

  // Normalize legacy values to strict schema: sale | rent | short-stay
  const availability = coerceAvailability(
    params.get("availability") || params.get("serviceType") || ""
  );

  // Accept ?location= and legacy ?q=
  const location = (params.get("location") || "").trim().toLowerCase();
  const legacyQ = (params.get("q") || "").trim().toLowerCase();
  const q = location || legacyQ;

  // Canonical type parsing (e.g., "studio" | "bedsitter" => "studio/bedsitter")
  const type = coerceType(params.get("type") || "");

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

  return { page, availability, q, location, type, minPrice, maxPrice, beds };
}

/**
 * Remove duplicate listings across sources (“listings”, “featured”, etc.)
 * Key order preference:
 *  1) explicit slug
 *  2) normalized "title|location"
 * Winner selection preference:
 *  - featured collection over others
 *  - has heroImage over missing
 *  - more images
 *  - first seen (stable)
 */
export function dedupeListings(listings: any[]): any[] {
  const keyOf = (it: any) => {
    const d = (it && it.data) || {};
    const slug = (d.slug || it.slug || "").toString().trim().toLowerCase();
    if (slug) return `slug:${slug}`;
    const title = (d.title || "").toString().trim().toLowerCase().replace(/\s+/g, " ");
    const loc = (d.location || "").toString().trim().toLowerCase().replace(/\s+/g, " ");
    return `tl:${title}|${loc}`;
  };

  const score = (it: any) => {
    const coll = (it && it.collection) || "";
    const d = (it && it.data) || {};
    const hasHero = !!d.heroImage;
    const imgCount = Array.isArray(d.images) ? d.images.length : 0;
    return (
      (coll === "featured" ? 1_000_000 : 0) +
      (hasHero ? 10_000 : 0) +
      imgCount
    );
  };

  const map = new Map<string, any>();
  for (const it of listings) {
    const k = keyOf(it);
    const cur = map.get(k);
    if (!cur) {
      map.set(k, it);
    } else {
      map.set(k, score(it) >= score(cur) ? it : cur);
    }
  }
  return Array.from(map.values());
}

/**
 * Filter a list of "listings" collection entries using the
 * object returned by parseSearchParams.
 *
 * Each item is expected to look like: { data: { ...fields }, collection, slug }
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

    // type (canonical)
    if (filters.type) {
      const t = coerceType(String(d.type || ""));
      if (narrowTypeMismatch(t, filters.type)) return false;
    }

    // q/location: exact area match, else fuzzy match on title/location/description
    if (filters.q) {
      const area = areaOf(String(d.location || "")).toLowerCase();
      const q = filters.q;
      const haystack = `${d.title || ""} ${d.location || ""} ${d.description || ""}`.toLowerCase();

      const exactAreaMatch = area && q && area === q;
      const fuzzyMatch = haystack.includes(q);

      if (!exactAreaMatch && !fuzzyMatch) return false;
    }

    // price (treat non-numeric as missing)
    const priceVal = typeof d.price === "number" ? d.price : moneyToNumber(d.price ?? "");
    if (filters.minPrice != null && filters.minPrice !== 0) {
      if (typeof priceVal !== "number" || priceVal < filters.minPrice) return false;
    }
    if (filters.maxPrice != null && filters.maxPrice !== 0) {
      if (typeof priceVal !== "number" || priceVal > filters.maxPrice) return false;
    }

    // bedrooms (exact for 1–4, min for 5+)
    if (filters.beds) {
      const have = Number(d.bedrooms) || 0;
      if (filters.beds.endsWith("+")) {
        const needMin = parseInt(filters.beds, 10);
        if (have < needMin) return false;
      } else {
        const needExact = parseInt(filters.beds, 10);
        if (have !== needExact) return false;
      }
    }

    return true;
  });
}

/**
 * Convenience: apply dedupe then filtering.
 */
export function getFilteredDeduped(
  listings: any[],
  filters: ReturnType<typeof parseSearchParams>
): any[] {
  return filterListings(dedupeListings(listings), filters);
}

// -------- helpers (SSR-safe coercions) --------

function coerceAvailability(val: string) {
  const raw = (val || "").toLowerCase().replace(/\s+/g, "-");
  // map legacy → normalized
  if (["sale", "for-sale", "buy", "sell"].includes(raw)) return "sale";
  if (["rent", "for-rent", "rental", "to-let"].includes(raw)) return "rent";
  if (["short-stay", "short-stays", "short", "stay"].includes(raw)) return "short-stay";
  return "";
}

function coerceType(val: string) {
  const v = (val || "").trim().toLowerCase();
  if (!v) return "";
  if (v === "studio" || v === "bedsitter") return "studio/bedsitter";
  return v;
}

// treat "studio"|"bedsitter" as same canonical
function narrowTypeMismatch(actual: string, wanted: string) {
  if (actual === wanted) return false;
  if (wanted === "studio/bedsitter") return actual !== "studio/bedsitter";
  return true;
}

function coerceBeds(val: string) {
  const v = String(val || "").trim();
  if (!v) return "";
  const plus = v.endsWith("+");
  const n = parseInt(v, 10);
  if (!Number.isFinite(n) || n <= 0) return "";
  return plus ? `${n}+` : String(n);
}

function areaOf(loc: string = "") {
  return (loc || "").split(",")[0].trim();
}

/* ===========================
   Browser-only utilities
   =========================== */

const hasWindow = typeof window !== "undefined";

function setQueryParam(key: string, value: string | number | null | undefined) {
  if (!hasWindow) return;
  const url = new URL(window.location.href);
  if (value === null || value === undefined || value === "" || value === 0) {
    url.searchParams.delete(key);
  } else {
    url.searchParams.set(key, String(value));
  }
  window.history.replaceState({}, "", url);
}

function getQueryParamInt(name: string, fallback = 1) {
  if (!hasWindow) return fallback;
  const n = parseInt(new URL(window.location.href).searchParams.get(name) || "", 10);
  return Number.isNaN(n) || n < 1 ? fallback : n;
}

/**
 * Prefill common search controls from the URL.
 */
export function hydrateControlsFromURL(root: Document | HTMLElement = document) {
  if (!hasWindow) return;
  const url = new URL(window.location.href);
  const set = (name: string) => {
    const el = root.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"], #${name}`);
    if (el) el.value = url.searchParams.get(name) || "";
  };
  ["location", "q", "minPrice", "maxPrice", "beds", "type", "availability"].forEach(set);
}

/**
 * Client-side pager for already-rendered cards.
 */
export function initSearchPagination(opts: {
  cardSelector: string;
  pagerSelector: string;
  resultCountSelector?: string;
  emptySelector?: string;
  pageSize?: number;
  scrollTo?: string;
}): void {
  if (!hasWindow) return;

  const {
    cardSelector,
    pagerSelector,
    resultCountSelector,
    emptySelector,
    pageSize = 12,
    scrollTo,
  } = opts;

  const getCards = () =>
    Array.from(document.querySelectorAll<HTMLElement>(cardSelector));

  const pagerEl = document.querySelector<HTMLElement>(pagerSelector);
  const resultEl = resultCountSelector
    ? document.querySelector<HTMLElement>(resultCountSelector)
    : null;
  const emptyEl = emptySelector
    ? document.querySelector<HTMLElement>(emptySelector)
    : null;

  function render(page = getQueryParamInt("page", 1)) {
    const cards = getCards();
    const total = cards.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (page > totalPages) page = totalPages;

    cards.forEach((c, i) => {
      const on = i >= (page - 1) * pageSize && i < page * pageSize;
      c.style.display = on ? "" : "none";
    });

    if (resultEl) resultEl.textContent = `${total} result${total !== 1 ? "s" : ""}`;
    if (emptyEl) emptyEl.classList.toggle("hidden", total !== 0);

    if (pagerEl) {
      pagerEl.innerHTML = "";
      if (totalPages > 1) {
        const mkBtn = (p: number, active = false) => {
          const a = document.createElement("button");
          a.type = "button";
          a.textContent = String(p);
          a.className = active
            ? "px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm font-semibold"
            : "px-3 py-1.5 rounded-md border border-neutral-300 text-sm hover:bg-neutral-50";
          a.addEventListener("click", () => {
            setQueryParam("page", p === 1 ? "" : p);
            render(p);
            if (scrollTo) {
              const target = document.querySelector(scrollTo) as HTMLElement | null;
              target?.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          });
          return a;
        };

        for (let p = 1; p <= totalPages; p++) {
          pagerEl.appendChild(mkBtn(p, p === page));
        }
      }
    }
  }

  (window as any).ListingPager = {
    refresh: (resetPage = false) => {
      if (resetPage) setQueryParam("page", "");
      render(resetPage ? 1 : getQueryParamInt("page", 1));
    },
  };

  render(getQueryParamInt("page", 1));
}
