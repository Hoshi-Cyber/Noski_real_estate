// pagination.js

// Helper to update URL query params
function updateQueryParams(params) {
  const url = new URL(window.location.href);
  Object.keys(params).forEach((key) => {
    if (params[key] !== "" && params[key] !== null && params[key] !== undefined) {
      url.searchParams.set(key, params[key]);
    } else {
      url.searchParams.delete(key);
    }
  });
  window.history.replaceState({}, "", url);
}

// Apply filters + page to URL
export function applyFilters() {
  const availability = document.querySelector("select[name='availability']")?.value || "";
  const q = document.querySelector("input[name='q']")?.value || "";
  const beds = document.querySelector("select[name='beds']")?.value || "";
  const type = document.querySelector("select[name='type']")?.value || "";

  updateQueryParams({ availability, q, beds, type, page: 1 });
}

// Handle pagination clicks
export function setupPagination() {
  document.querySelectorAll("[data-page]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const page = btn.getAttribute("data-page");
      const url = new URL(window.location.href);
      url.searchParams.set("page", page);
      window.location.href = url.toString();
    });
  });
}

// Prefill filters from URL when page loads
export function prefillFiltersFromURL() {
  const url = new URL(window.location.href);
  const availability = url.searchParams.get("availability") || "";
  const q = url.searchParams.get("q") || "";
  const beds = url.searchParams.get("beds") || "";
  const type = url.searchParams.get("type") || "";

  const availabilityEl = document.querySelector("select[name='availability']");
  const qEl = document.querySelector("input[name='q']");
  const bedsEl = document.querySelector("select[name='beds']");
  const typeEl = document.querySelector("select[name='type']");

  if (availabilityEl) availabilityEl.value = availability;
  if (qEl) qEl.value = q;
  if (bedsEl) bedsEl.value = beds;
  if (typeEl) typeEl.value = type;
}
