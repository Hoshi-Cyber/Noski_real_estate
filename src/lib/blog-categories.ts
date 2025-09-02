// src/lib/blog-categories.ts
export const BLOG_CATEGORIES = {
  'buying-renting-tips': {
    label: 'Buyer & Renter Tips',
    description: 'Practical guidance for buyers and renters—costs, process, and local intel.',
  },
  'seller-marketing-tips': {
    label: 'Seller & Marketing Tips',
    description: 'Positioning, pricing and promotion ideas to sell with confidence.',
  },
  'short-stay-lifestyle': {
    label: 'Short-Stay & Lifestyle',
    description: 'Hosting, short-stay strategy and lifestyle picks around the city.',
  },
  'local-living-features': {
    label: 'Local Living Features',
    description: 'Neighbourhood deep-dives—commute, schools, amenities and feel.',
  },
} as const;

export type CategorySlug = keyof typeof BLOG_CATEGORIES;

export const CATEGORY_ORDER: CategorySlug[] = [
  'buying-renting-tips',
  'seller-marketing-tips',
  'short-stay-lifestyle',
  'local-living-features',
];
