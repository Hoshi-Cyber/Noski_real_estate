/**
 * PostCSS configuration used by Tailwind. Autoprefixer ensures
 * cross‑browser compatibility on generated CSS. When building
 * the project for production this file will be invoked by Astro.
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};