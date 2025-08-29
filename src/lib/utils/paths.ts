import { withV } from '../assets';

/**
 * Resolve property listing image with fallbacks.
 */
export function resolveListingImage(
  slug: string,
  imagesFolder?: string,
  images?: string[],
  singleImage?: string
): string {
  const featuredMain = `/images/featured/${slug}/main.webp`;
  const listingMain = `/images/listings/${slug}/main.webp`;
  const folderMain = imagesFolder
    ? `${imagesFolder.replace(/\/$/, '')}/main.webp`
    : '';
  const firstImage = images && images.length > 0 ? images[0] : '';
  const placeholder = '/images/placeholders/listing.webp';

  const chosen =
    (featuredMain && featuredMain) ||
    (listingMain && listingMain) ||
    (folderMain && folderMain) ||
    (firstImage && firstImage) ||
    (singleImage && singleImage) ||
    placeholder;

  return withV(chosen);
}

/**
 * Build clean property detail href.
 */
export function buildListingHref(
  availability: string | undefined,
  slug: string
): string {
  const availSeg = (availability || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .trim();

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
      normalized = 'short-stays';
      break;
    default:
      normalized = availSeg || 'for-sale';
  }

  return `/properties/${normalized}/${slug}`;
}
