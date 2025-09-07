// astro.config.mjs
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'url';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import netlify from '@astrojs/netlify';

const srcPath = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  site: 'https://noski-real-estate.netlify.app',
  output: 'static',
  adapter: netlify(),
  integrations: [react(), tailwind({ applyBaseStyles: true })],
  markdown: { remarkPlugins: [], rehypePlugins: [] },
  vite: {
    resolve: {
      alias: {
        '@': srcPath,
        '~': srcPath
      }
    }
  }
});
