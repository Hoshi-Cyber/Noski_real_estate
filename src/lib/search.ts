// lib/search.ts

import { moneyToNumber } from "./utils";

// Ensure type compatibility for URL or URLSearchParams
type SearchParamsInput = URL | URLSearchParams;

function getParams(input: SearchParamsInput): URLSearchParams {
  if (input instanceof URL) {
    return input.searchParams;
  }
  return input;
}

export function parseSearchParams(input: SearchParamsInput) {
  const params = getParams(input);

  const availability = coerceAvailability(params.get("availability") || "");
  const q = (params.get("q") || "").trim();
  let minPrice = moneyToNumber(params.get("minPrice") || "");
  let maxPrice = moneyToNumber(params.get("maxPrice") || "");
  const beds = coerceBeds(params.get("beds") || "");
  const page = Math.max(parseInt(params.get("page") || "1", 10), 1);

  // Swap if min > max
  if (minPrice && maxPrice && minPrice > maxPrice) {
    const tmp = minPrice;
    minPrice = maxPrice;
    maxPrice = tmp;
  }

  return { page, availability, q, minPrice, maxPrice, beds };
}

// Helpers
function coerceAvailability(val: string) {
  const allowed = ["for-sale", "for-rent", "short-stays"];
  return allowed.includes(val) ? val : "";
}

function coerceBeds(val: string) {
  if (!val) return "";
  const n = parseInt(val, 10);
  return isNaN(n) ? "" : n.toString();
}
