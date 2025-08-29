import { defineCollection, z } from 'astro:content';

// 🏠 Shared schema for all listings
const listingsSchema = z.object({
  title: z.string(),
  price: z.number().optional(),
  location: z.string(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  type: z.string().describe('e.g., Apartment, House, Villa, Bedsitter/Studio, Commercial'),
  availability: z.string().describe('e.g., For Rent, For Sale, Short Stays'),
  images: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  description: z.string().optional(),
  heroImage: z.string().optional(),
});

// 🏠 Listings
const listings = defineCollection({
  type: 'content',
  schema: listingsSchema,
});

// 🌟 Featured Listings (uses same schema)
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
    category: z.string().optional(),
    pubDate: z.coerce.date().optional(),
    download: z.string().optional(),
    ctaLink: z.string().optional(),
  }),
});

export const collections = {
  listings,
  featured,
  blog,
  resources,
};
