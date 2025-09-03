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
   Listings (tolerant schema)
--------------------------------- */
const listingsSchema = z.object({
  title: z.string(),
  price: z.number().optional(),
  location: z.string(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  type: z.string().describe('e.g., Apartment, House, Villa, Bedsitter/Studio, Commercial'),
  availability: z.string().describe('e.g., For Rent, For Sale, Short Stays'),
  heroImage: z.string().optional(),
  image: z.string().optional(),
  images: z.array(z.string()).optional(),
  imagesFolder: z.string().optional(),

  amenities: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),

  // Accept either strings or objects like:
  // - Easy access to international schools: Brookhouse, Hillcrest, Banda
  neighborhoodHighlights: z
    .array(z.union([z.string(), z.record(z.any())]))
    .optional()
    .transform((arr) =>
      (arr ?? []).map((item) => {
        if (typeof item === 'string') return item;
        // flatten { key: value } -> "key: value" (and arrays -> comma list)
        return Object.entries(item)
          .map(([k, v]) =>
            v == null || v === ''
              ? String(k)
              : `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`
          )
          .join(', ');
      })
    ),

  // Optional grouped variants (used by the UI when provided)
  amenitiesCategories: z.record(z.array(z.string())).optional(),
  neighborhoodCategories: z.record(z.array(z.string())).optional(),

  description: z.string().optional(),
});

const listings = defineCollection({ type: 'content', schema: listingsSchema });

/* --------------------------------
   Featured Listings (reuse)
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
    description: z.string(),
    category: z.string(),
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
    description: z.string(),
    section: resourceSection,
    pubDate: z.coerce.date().optional(),
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
   Developments (NEW)
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
  slug: strNullish,
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
