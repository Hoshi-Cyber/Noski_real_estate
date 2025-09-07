// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify/static';

export default defineConfig({
  site: 'https://noski-real-estate.netlify.app',
  output: 'static',
  adapter: netlify(),
  integrations: [
    react(),
    tailwind({ applyBaseStyles: true }),
  ],
  markdown: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});
