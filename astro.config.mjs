// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  // Replace with your final domain when you deploy (optional for local dev)
  site: 'https://www.severino-realty.example',

  // Build a fully static site (no adapter needed)
  output: 'static',

  integrations: [
    react(),
    tailwind({
      applyBaseStyles: true, // ✅ correct option shape for @astrojs/tailwind
    }),
  ],

  // Keep markdown plugin slots available (optional)
  markdown: {
    remarkPlugins: [],
    rehypePlugins: [],
  },

  // Use default static build format (directory). Remove custom SSR format.
  // build: { format: 'directory' }, // optional; default is fine
});
