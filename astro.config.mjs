// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify/functions';

export default defineConfig({
  // Production domain for Netlify deploy
  site: 'https://noski-real-estate.netlify.app',

  // Switch from static to server output for Netlify adapter
  output: 'server',
  adapter: netlify(),

  integrations: [
    react(),
    tailwind({
      applyBaseStyles: true,
    }),
  ],

  // Keep markdown plugin slots available
  markdown: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});
