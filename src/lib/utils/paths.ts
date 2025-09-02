import { withV } from '../assets';

/* =======================================================
 * LISTINGS: image + link helpers
 * =====================================================*/

/**
 * Resolve a property listing image with sensible fallbacks.
 * Priority:
 *  1) singleImage (explicit)
 *  2) images[0] (first provided)
 *  3) imagesFolder/{main.webp|1.webp}
 *  4) /images/listings/{slug}/{main.webp|1.webp}
 *  5) /images/featured/{slug}/{main.webp|1.webp}
 *  6) placeholder
 */
export function resolveListingImage(
  slug: string,
  imagesFolder?: string,
  images?: string[],
  singleImage?: string
): string {
  const safeFolder = (imagesFolder || '').replace(/\/+$/, '');
  const firstImage = images?.[0] || '';

  const candidates = [
    singleImage || '',
    firstImage || '',
    safeFolder ? `${safeFolder}/main.webp` : '',
    safeFolder ? `${safeFolder}/1.webp` : '',
    slug ? `/images/listings/${slug}/main.webp` : '',
    slug ? `/images/listings/${slug}/1.webp` : '',
    slug ? `/images/featured/${slug}/main.webp` : '',
    slug ? `/images/featured/${slug}/1.webp` : '',
    '/images/placeholders/listing.webp',
  ].filter(Boolean);

  return withV(candidates[0]!);
}

/**
 * Build clean property detail href.
 * Maps availability to: for-sale | for-rent | short-stays
 * Final path: /properties/{availability}/{slug}
 */
export function buildListingHref(
  availability: string | undefined,
  slug: string
): string {
  const availSeg = (availability || '').toLowerCase().replace(/\s+/g, '-').trim();

  let normalized: string;
  switch (availSeg) {
    case 'for-sale':
    case 'sale':
      normalized = 'for-sale';
      break;
    case 'for-rent':
    case 'rent':
      normalized = 'for-rent';
      break;
    case 'short-stay':
    case 'short-stays':
    case 'shortstay':
    case 'shortstays':
    case 'short':
      normalized = 'short-stays';
      break;
    default:
      normalized = availSeg || 'for-sale';
  }

  return `/properties/${normalized}/${slug}`;
}

/* =======================================================
 * RESOURCES: image + link helpers
 * =====================================================*/

type ResourceLike = {
  slug: string;
  data?: {
    section?: string;        // 'guides' | 'faqs' | 'market-reports'
    imagesFolder?: string;
    heroImage?: string;
    image?: string;
    icon?: string;
  };
};

function normalizeSection(section?: string) {
  const v = String(section || '').toLowerCase().trim();
  if (v === 'faqs' || v === 'faq') return 'faqs';
  if (v === 'market-reports' || v === 'market' || v === 'reports' || v === 'market_reports')
    return 'market-reports';
  return 'guides';
}

/**
 * Build clean resource href from its section + slug.
 * /resources/{guides|faqs|market-reports}/{slug}
 */
export function buildResourceHref(res: ResourceLike): string {
  const section = normalizeSection(res?.data?.section);
  const slug = res?.slug || '';
  return `/resources/${section}/${slug}`;
}

/**
 * Resolve a resource image with sensible fallbacks.
 * Priority:
 *  1) heroImage
 *  2) image
 *  3) imagesFolder/{cover.webp|hero.webp|1.webp}
 *  4) /images/resources/{section}/{slug}/{cover.webp|main.webp|1.webp}
 *  5) placeholder
 */
export function resolveResourceImage(
  slug: string,
  section?: string,
  imagesFolder?: string,
  heroImage?: string,
  image?: string
): string {
  const sec = normalizeSection(section);
  const safeFolder = (imagesFolder || '').replace(/\/+$/, '');

  const candidates = [
    heroImage || '',
    image || '',
    safeFolder ? `${safeFolder}/cover.webp` : '',
    safeFolder ? `${safeFolder}/hero.webp` : '',
    safeFolder ? `${safeFolder}/1.webp` : '',
    slug ? `/images/resources/${sec}/${slug}/cover.webp` : '',
    slug ? `/images/resources/${sec}/${slug}/main.webp` : '',
    slug ? `/images/resources/${sec}/${slug}/1.webp` : '',
    '/images/placeholders/resource.webp',
  ].filter(Boolean);

  return withV(candidates[0]!);
}
