// src/lib/pagination.js

// ===== SSR guard =====
const hasWindow = typeof window !== 'undefined';

/**
 * @typedef {Object} FilterSelectors
 * @property {string=} q        // text search input
 * @property {string=} location // location select/input
 * @property {string=} beds     // min beds (preferred key)
 * @property {string=} bedrooms // alias: some pages used "bedrooms"
 * @property {string=} type     // exact match
 */

/**
 * @typedef {Object} InitOptions
 * @property {number=} pageSize
 * @property {FilterSelectors=} filterSelectors
 * @property {string=} clearSelector
 * @property {string} cardSelector      // e.g. '#cards .card'
 * @property {string} pagerSelector     // e.g. '#pager'
 * @property {string} emptySelector     // e.g. '#empty'
 * @property {string=} resultCountSelector // e.g. '#result-count'
 */

const bySel = (sel, root = document) => (sel ? root.querySelector(sel) : null);
const bySelAll = (sel, root = document) => (sel ? Array.from(root.querySelectorAll(sel)) : []);
const getURL = () => new URL(window.location.href);

function setQuery(params, replace = true) {
  const url = getURL();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '' || (typeof v === 'number' && !v)) {
      url.searchParams.delete(k);
    } else {
      url.searchParams.set(k, String(v));
    }
  });
  (replace ? window.history.replaceState : window.history.pushState).call(
    window.history,
    {},
    '',
    url
  );
}

function readQuery() {
  const url = getURL();
  return {
    q: (url.searchParams.get('q') || '').trim(),
    location: (url.searchParams.get('location') || '').trim(),
    beds: (url.searchParams.get('beds') || '').trim(),
    type: (url.searchParams.get('type') || '').trim(),
    page: Math.max(1, parseInt(url.searchParams.get('page') || '1', 10)),
  };
}

function setFieldValue(sel, value) {
  if (!sel) return;
  const el = bySel(sel);
  if (!el) return;
  if ('value' in el) el.value = value ?? '';
}

function cardSearchText(node) {
  const dt = node.getAttribute('data-title');
  return (dt || node.textContent || '').toLowerCase();
}

function cardMeta(node) {
  return {
    location: (node.getAttribute('data-loc') || '').toLowerCase(),
    type: (node.getAttribute('data-type') || '').toLowerCase(),
    beds: parseInt(node.getAttribute('data-beds') || '0', 10) || 0,
    avail: (node.getAttribute('data-avail') || '').toLowerCase(),
  };
}

function renderPager(container, currentPage, totalPages, makeHref, onClick) {
  if (!container) return;
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const html = [
    `<nav aria-label="Pagination" class="mt-8 flex items-center justify-center gap-2">`,
    `<a href="${makeHref(Math.max(1, currentPage - 1))}" data-pg="${Math.max(1, currentPage - 1)}" rel="prev" class="pg-btn ${currentPage === 1 ? 'pg-disabled' : ''}" aria-disabled="${currentPage === 1}">Prev</a>`,
    ...pages.map((p) => {
      const active = p === currentPage;
      return `<a href="${makeHref(p)}" data-pg="${p}" class="pg-num ${active ? 'pg-active' : ''}" ${active ? 'aria-current="page"' : ''}>${p}</a>`;
    }),
    `<a href="${makeHref(Math.min(totalPages, currentPage + 1))}" data-pg="${Math.min(totalPages, currentPage + 1)}" rel="next" class="pg-btn ${currentPage === totalPages ? 'pg-disabled' : ''}" aria-disabled="${currentPage === totalPages}">Next</a>`,
    `</nav>`,
  ].join('');

  container.innerHTML = html;

  container.querySelectorAll('a[data-pg]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const page = parseInt(a.getAttribute('data-pg') || '1', 10);
      onClick(page);
    });
  });
}

function makeEngine(opts) {
  const {
    pageSize = 12,
    filterSelectors = {},
    clearSelector,
    cardSelector,
    pagerSelector,
    emptySelector,
    resultCountSelector,
  } = opts;

  const pagerEl = bySel(pagerSelector);
  const emptyEl = bySel(emptySelector);
  const resultCountEl = bySel(resultCountSelector);

  let cards = [];
  let filtered = [];
  let currentPage = 1;

  function readCards() {
    cards = bySelAll(cardSelector);
  }

  function readFilters() {
    const qCtrl = filterSelectors.q && bySel(filterSelectors.q);
    const locCtrl = filterSelectors.location && bySel(filterSelectors.location);
    const bedsSel = filterSelectors.beds || filterSelectors.bedrooms; // accept both
    const bedsCtrl = bedsSel && bySel(bedsSel);
    const typeCtrl = filterSelectors.type && bySel(filterSelectors.type);

    const fromURL = readQuery();

    const q = (qCtrl ? qCtrl.value : fromURL.q).trim();
    const location = (locCtrl ? locCtrl.value : fromURL.location).trim();
    const bedsStr = (bedsCtrl ? bedsCtrl.value : fromURL.beds).trim();
    const type = (typeCtrl ? typeCtrl.value : fromURL.type).trim();

    return {
      q: q.toLowerCase(),
      location: location.toLowerCase(),
      beds: bedsStr ? parseInt(bedsStr, 10) || 0 : 0,
      type: type.toLowerCase(),
    };
  }

  function applyFilters() {
    const { q, location, beds, type } = readFilters();

    filtered = cards.filter((node) => {
      const meta = cardMeta(node);

      const passQ = !q || cardSearchText(node).includes(q);
      const passLoc = !location || meta.location.includes(location);
      const passBeds = !beds || meta.beds >= beds;
      const passType = !type || meta.type === type;

      return passQ && passLoc && passBeds && passType;
    });

    if (resultCountEl) {
      const n = filtered.length;
      resultCountEl.textContent = `${n} listing${n === 1 ? '' : 's'}`;
    }
  }

  function showPage(page) {
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    currentPage = Math.min(Math.max(1, page), totalPages);

    // Hide all first
    cards.forEach((n) => {
      n.style.display = 'none';
      n.setAttribute('aria-hidden', 'true');
    });

    if (filtered.length === 0) {
      if (emptyEl) emptyEl.classList.remove('hidden'); // class-based toggle
    } else {
      if (emptyEl) emptyEl.classList.add('hidden');
      const start = (currentPage - 1) * pageSize;
      const slice = filtered.slice(start, start + pageSize);
      slice.forEach((n) => {
        n.style.display = '';
        n.removeAttribute('aria-hidden');
      });
    }

    const makeHref = (p) => {
      const url = getURL();
      url.searchParams.set('page', String(p));
      const { q, location, beds, type } = readFilters();
      q ? url.searchParams.set('q', q) : url.searchParams.delete('q');
      location ? url.searchParams.set('location', location) : url.searchParams.delete('location');
      beds ? url.searchParams.set('beds', String(beds)) : url.searchParams.delete('beds');
      type ? url.searchParams.set('type', type) : url.searchParams.delete('type');
      return url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '');
    };

    renderPager(pagerEl, currentPage, totalPages, makeHref, (p) => {
      setQuery({ page: p }, true); // update URL without reload
      showPage(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function hydrateFieldsFromURL() {
    const q = readQuery();
    setFieldValue(filterSelectors.q, q.q);
    setFieldValue(filterSelectors.location, q.location);
    setFieldValue(filterSelectors.beds || filterSelectors.bedrooms, q.beds);
    setFieldValue(filterSelectors.type, q.type);
  }

  function syncURL(resetPage = false) {
    const { q, location, beds, type } = readFilters();
    const params = { q, location, type };
    if (beds) params.beds = beds;
    params.page = resetPage ? 1 : currentPage;
    setQuery(params, true);
  }

  function refresh(resetPage = false) {
    readCards();
    applyFilters();
    if (resetPage) currentPage = 1;
    const q = readQuery();
    showPage(resetPage ? 1 : q.page);
  }

  return {
    refresh,
    hookUI() {
      hydrateFieldsFromURL();

      // Filter change handlers
      ['q', 'location', 'beds', 'bedrooms', 'type'].forEach((key) => {
        const sel = filterSelectors[key];
        const el = sel ? bySel(sel) : null;
        if (!el) return;
        const handler = () => {
          syncURL(true);
          refresh(true);
        };
        el.addEventListener('input', handler);
        el.addEventListener('change', handler);
      });

      // Clear button
      const clearBtn = bySel(clearSelector);
      if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
          e.preventDefault();
          ['q', 'location', 'beds', 'bedrooms', 'type'].forEach((key) =>
            setFieldValue(filterSelectors[key], '')
          );
          setQuery({ q: '', location: '', beds: '', type: '', page: 1 }, true);
          refresh(true);
        });
      }

      // Back/forward
      window.addEventListener('popstate', () => {
        hydrateFieldsFromURL();
        refresh(false);
      });
    },
  };
}

export function initPaginationAndFilters(options = {}) {
  if (!hasWindow) return;
  if (!options.cardSelector || !options.pagerSelector || !options.emptySelector) {
    console.warn('[pagination] Missing required selectors (card/pager/empty).');
    return;
  }

  const engine = makeEngine(options);
  engine.hookUI();
  engine.refresh(false);

  // Optional global handle
  window.ListingPager = {
    refresh: () => engine.refresh(false),
    resetAndRefresh: () => engine.refresh(true),
  };
}

// Legacy no-ops for backward compatibility
export function applyFilters() {}
export function setupPagination() {}
export function prefillFiltersFromURL() {}
