import { defineCollection, z } from 'astro:content';

// ----- Shared enums / helpers -----
const resourceSection = z.enum(['guides', 'faqs', 'market-reports']);

// 🏠 Shared schema for listings
const listingsSchema = z.object({
  title: z.string(),
  price: z.number().optional(),
  location: z.string(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  type: z.string().describe('e.g., Apartment, House, Villa, Bedsitter/Studio, Commercial'),
  availability: z.string().describe('e.g., For Rent, For Sale, Short Stays'),
  // images
  heroImage: z.string().optional(),
  image: z.string().optional(),            // single image (optional)
  images: z.array(z.string()).optional(),  // gallery (optional)
  imagesFolder: z.string().optional(),     // folder for asset resolution (optional)
  // misc
  amenities: z.array(z.string()).optional(),
  description: z.string().optional(),
});

// 🏠 Listings
const listings = defineCollection({
  type: 'content',
  schema: listingsSchema,
});

// 🌟 Featured Listings (same schema)
const featured = defineCollection({
  type: 'content',
  schema: listingsSchema,
});

// 📰 Blog
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    description: z.string(),
    category: z.string(),
    heroImage: z.string().optional(),
  }),
});

// 📘 Resources
const resources = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    section: resourceSection,             // 'guides' | 'faqs' | 'market-reports' (required)
    pubDate: z.coerce.date().optional(),
    // linking / downloads
    download: z.string().optional(),
    ctaLink: z.string().optional(),
    // images (for robust resolver)
    heroImage: z.string().optional(),
    image: z.string().optional(),
    imagesFolder: z.string().optional(),
    icon: z.string().optional(),
    // legacy/optional
    category: z.string().optional(),
  }),
});

export const collections = {
  listings,
  featured,
  blog,
  resources,
};
