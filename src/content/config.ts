import { defineCollection, z } from 'astro:content';

/* -------------------------------
   Shared enums / helpers
-------------------------------- */
const resourceSection = z.enum(['guides', 'faqs', 'market-reports']);

/** Accept absolute http(s) OR site-relative (/docs/.., ./file.pdf, ../file.pdf) */
const urlish = z
  .string()
  .refine(
    (v) =>
      v === '' ||
      /^https?:\/\//i.test(v) ||
      v.startsWith('/') ||
      v.startsWith('./') ||
      v.startsWith('../'),
    { message: 'Must be absolute or site/relative URL' }
  );

// convenience
const strNullish = z.string().optional().nullable();
const urlNullish = urlish.optional().nullable();

/* --------------------------------
   Listings (STRICT schema per audit)
   Note: Do NOT define a 'slug' field. Astro reserves it.
--------------------------------- */
const availabilityEnum = z.enum(['sale', 'rent', 'short-stay']);

const listingsSchema = z.object({
  /* Core identity */
  title: z.string().min(3),

  /* Classifiers */
  availability: availabilityEnum, // sale|rent|short-stay
  type: z.string().min(2).describe('e.g., apartment, house, villa, studio, commercial'),
  location: z.string().min(2),

  /* Pricing + specs */
  price: z.number().int().nonnegative(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().int().nonnegative(),

  /* Quick Facts (required per audit) */
  lotSize: z.string().min(1),
  parking: z.string().min(1),
  yearBuilt: z.string().min(1),
  tenure: z.string().min(1),
  serviceCharge: z.string().min(1),

  /* Media */
  heroImage: z.string().min(1), // e.g. "/images/listings/xxx/hero.webp"
  image: z.string().optional(), // legacy single image (kept for compatibility)
  images: z.array(z.string()).default([]),
  imagesFolder: z.string().optional(),

  /* Amenities / features */
  amenities: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),

  /* Neighborhood highlights (stringify object entries if provided as records) */
  neighborhoodHighlights: z
    .array(z.union([z.string(), z.record(z.any())]))
    .default([])
    .transform((arr) =>
      (arr ?? []).map((item) => {
        if (typeof item === 'string') return item;
        return Object.entries(item)
          .map(([k, v]) =>
            v == null || v === ''
              ? String(k)
              : `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`
          )
          .join(', ');
      })
    ),

  amenitiesCategories: z.record(z.array(z.string())).optional(),
  neighborhoodCategories: z.record(z.array(z.string())).optional(),

  /* Content */
  description: z.string().optional(),

  /* Badges for cards */
  isNew: z.boolean().default(false),
  isReduced: z.boolean().default(false),
  isFurnished: z.boolean().default(false),
});

const listings = defineCollection({ type: 'content', schema: listingsSchema });

/* --------------------------------
   Featured Listings (reuse strict)
--------------------------------- */
const featured = defineCollection({ type: 'content', schema: listingsSchema });

/* --------------------------------
   Blog
--------------------------------- */
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    category: z.string(),
    excerpt: z.string().optional(),
    description: z.string().optional(),
    heroImage: z.string().optional(),
  }),
});

/* --------------------------------
   Resources
--------------------------------- */
const resources = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    excerpt: z.string().optional(),
    description: z.string().optional(),
    section: resourceSection,
    pubDate: z.coerce.date().optional(),
    readingTime: z.string().optional(),
    download: urlNullish,
    ctaLink: urlNullish,
    heroImage: z.string().optional(),
    image: z.string().optional(),
    imagesFolder: z.string().optional(),
    icon: z.string().optional(),
    category: z.string().optional(),
  }),
});

/* --------------------------------
   Guides
--------------------------------- */
const guides = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    category: z.enum(['buying', 'selling', 'renting-landlord', 'investment']),
    pdfHref: urlNullish,
    heroImage: z.string().optional(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

/* --------------------------------
   Developments (NEW)
   Note: Do NOT define a 'slug' field. Astro reserves it.
--------------------------------- */
const geoSchema = z.object({
  city: z.string().min(1),
  estate: strNullish,
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const mediaSchema = z.object({
  photos: z.array(z.string()).default([]),
  planPdfs: z.array(urlish).default([]),
});

const ctaSchema = z.object({
  label: z.string(),
  href: urlNullish,
  action: z.enum(['link', 'download', 'lead', 'whatsapp']).default('link'),
});

const developmentBase = z.object({
  title: z.string(),
  // slug: (removed) — use entry.slug from file path
  status: strNullish,
  location: geoSchema,
  priceFrom: z.number().optional(),
  priceTo: z.number().optional(),
  tenure: strNullish,
  amenities: z.array(z.string()).default([]),
  approvals: z.array(z.string()).default([]),
  media: mediaSchema.default({ photos: [], planPdfs: [] }),
  ctas: z.array(ctaSchema).default([]),
});

const newDevelopmentSchema = developmentBase.extend({
  category: z.literal('new_development'),
  developer_name: z.string().min(1),
  developer_track_record_url: urlNullish,
  phase: strNullish,
  expected_completion_date: z.coerce.date().optional().nullable(),
  payment_plan: z
    .array(
      z.object({
        stage: strNullish,
        percent: z.number().min(0).max(100).optional(),
        dueOn: strNullish,
        note: strNullish,
      })
    )
    .default([]),
});

const unfinishedProjectSchema = developmentBase.extend({
  category: z.literal('unfinished_project'),
  completion_stage: strNullish,
  completion_percent: z.number().min(0).max(100).optional(),
  est_completion_cost_min: z.number().optional(),
  est_completion_cost_max: z.number().optional(),
  boq_url: urlNullish,
  permits_status: strNullish,
  risk_notes: strNullish,
  structural_report_url: urlNullish,
  owner_name: strNullish,
});

const developmentsSchema = z.discriminatedUnion('category', [
  newDevelopmentSchema,
  unfinishedProjectSchema,
]);

const developments = defineCollection({
  type: 'content',
  schema: developmentsSchema,
});

/* --------------------------------
   Exports
--------------------------------- */
export const collections = {
  listings,
  featured,
  blog,
  resources,
  guides,
  developments,
};

export type DevelopmentBase = z.infer<typeof developmentBase>;
export type DevelopmentNew = z.infer<typeof newDevelopmentSchema>;
export type DevelopmentUnfinished = z.infer<typeof unfinishedProjectSchema>;
export type DevelopmentEntry = z.infer<typeof developmentsSchema>;

export function isNewDevelopment(d: DevelopmentEntry): d is DevelopmentNew {
  return d.category === 'new_development';
}
export function isUnfinishedProject(d: DevelopmentEntry): d is DevelopmentUnfinished {
  return d.category === 'unfinished_project';
}
