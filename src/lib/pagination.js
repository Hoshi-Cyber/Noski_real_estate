// src/lib/pagination.js

// ---- Internal: feature-detect window for SSR safety ----
const hasWindow = typeof window !== 'undefined';

// Helper to update URL query params (no navigation)
function updateQueryParams(params) {
  if (!hasWindow) return;
  const url = new URL(window.location.href);
  Object.keys(params).forEach((key) => {
    const val = params[key];
    if (val !== '' && val !== null && val !== undefined) {
      url.searchParams.set(key, String(val));
    } else {
      url.searchParams.delete(key);
    }
  });
  window.history.replaceState({}, '', url);
}

// Read a form field value by name (scoped to root/form if provided)
function readField(name, root = document) {
  const el = root.querySelector(`[name="${name}"]`);
  if (!el) return '';
  if (el instanceof HTMLInputElement) {
    if (el.type === 'checkbox') return el.checked ? (el.value || 'on') : '';
    return el.value || '';
  }
  if (el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
    return el.value || '';
  }
  return '';
}

// ---------------------------------------------------------------------------
// Public API (kept for backward compatibility)
// ---------------------------------------------------------------------------

// Apply filters + reset page to 1 (updates URL, no navigation)
export function applyFilters(opts = {}) {
  if (!hasWindow) return;

  const root = opts.root || document;

  const availability = readField('availability', root);
  const q = readField('q', root);
  const beds = readField('beds', root);
  const type = readField('type', root);
  const minPrice = readField('minPrice', root);
  const maxPrice = readField('maxPrice', root);

  updateQueryParams({ availability, q, beds, type, minPrice, maxPrice, page: 1 });

  // If you prefer a full navigation instead of history replace, uncomment:
  // const url = new URL(window.location.href);
  // window.location.href = url.toString();
}

// Handle pagination clicks
export function setupPagination(selector = '[data-page]') {
  if (!hasWindow) return;

  document.querySelectorAll(selector).forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const page = btn.getAttribute('data-page') || '1';
      const url = new URL(window.location.href);
      url.searchParams.set('page', page);
      window.location.href = url.toString(); // navigate so page content refreshes
    });
  });

  // Fallback for rel="next|prev"
  document.querySelectorAll('a[rel="next"], a[rel="prev"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const rel = a.getAttribute('rel');
      const url = new URL(window.location.href);
      const current = parseInt(url.searchParams.get('page') || '1', 10);
      const next = rel === 'next' ? current + 1 : Math.max(1, current - 1);
      url.searchParams.set('page', String(next));
      window.location.href = url.toString();
    });
  });
}

// Prefill filters from URL when page loads
export function prefillFiltersFromURL(opts = {}) {
  if (!hasWindow) return;

  const root = opts.root || document;
  const url = new URL(window.location.href);

  const availability = url.searchParams.get('availability') || '';
  const q = url.searchParams.get('q') || '';
  const beds = url.searchParams.get('beds') || '';
  const type = url.searchParams.get('type') || '';
  const minPrice = url.searchParams.get('minPrice') || '';
  const maxPrice = url.searchParams.get('maxPrice') || '';

  const setVal = (name, value) => {
    const el = root.querySelector(`[name="${name}"]`);
    if (el) el.value = value;
  };

  setVal('availability', availability);
  setVal('q', q);
  setVal('beds', beds);
  setVal('type', type);
  setVal('minPrice', minPrice);
  setVal('maxPrice', maxPrice);
}

// ---------------------------------------------------------------------------
// New helper expected by pages: initPaginationAndFilters
// Wires up: prefill -> form listeners -> reset buttons -> pagination
// ---------------------------------------------------------------------------
export function initPaginationAndFilters(options = {}) {
  if (!hasWindow) return;

  const {
    formSelector = '#filters',
    pageLinkSelector = '[data-page]',
    resetSelector = '[data-reset]',
    submitOnChange = true, // change selects/inputs triggers applyFilters
  } = options;

  prefillFiltersFromURL();

  const form = document.querySelector(formSelector);
  if (form) {
    // Submit -> apply filters (and reset page=1)
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      applyFilters({ root: form });
      // Navigate to ensure static content updates:
      const url = new URL(window.location.href);
      window.location.href = url.toString();
    });

    // Live update on change (optional)
    if (submitOnChange) {
      form.addEventListener('change', (e) => {
        const el = e.target;
        if (el && (el.matches('select') || el.matches('input'))) {
          applyFilters({ root: form });
        }
      });
    }

    // Reset buttons
    form.querySelectorAll(resetSelector).forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        form.reset();
        const url = new URL(window.location.href);
        url.search = '';
        window.location.href = url.toString();
      });
    });
  }

  setupPagination(pageLinkSelector);
}
