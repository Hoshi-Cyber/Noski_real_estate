/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte,md,mdx}",
    "./public/**/*.html",
  ],

  // Use variants here instead of putting `hover:` / `focus:` in the regex.
  safelist: [
    // Typography
    { pattern: /^prose(-\w+)?$/ },

    // Backgrounds
    {
      pattern:
        /^bg-(primary|cta|accent|neutral)-(50|100|200|300|500|600|800|90|active)?$/,
      variants: ["hover", "active"],
    },

    // Text colors
    {
      pattern:
        /^text-(primary|cta|accent|neutral)-(50|100|200|300|500|600|800|90|active)?$/,
      variants: ["hover", "active"],
    },

    // Borders
    {
      pattern:
        /^border-(primary|cta|accent|neutral)-(50|100|200|300|500|600|800|90|active)?$/,
      variants: ["hover", "focus"],
    },

    // Ring
    { pattern: /^ring-(primary|cta|accent)$/, variants: ["focus"] },
  ],

  theme: {
    extend: {
      // Breakpoints
      screens: {
        xs: "320px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },

      // Fonts
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Merriweather", "serif"],
        mono: ["Fira Code", "monospace"],
      },

      // Design tokens mapped to CSS variables
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          90: "var(--color-primary-90)",
          active: "var(--color-primary-active)",
        },
        accent: { DEFAULT: "var(--color-accent)" },
        cta: {
          DEFAULT: "var(--color-cta)",
          90: "var(--color-cta-90)",
          active: "var(--color-cta-active)",
        },
        neutral: {
          50: "var(--color-neutral-50)",
          100: "var(--color-neutral-100)",
          200: "var(--color-neutral-200)",
          300: "var(--color-neutral-300)",
          500: "var(--color-neutral-500)",
          600: "var(--color-neutral-600)",
          800: "var(--color-neutral-800)",
        },
      },

      spacing: {
        section: "var(--space-section)",
      },
    },
  },

  plugins: [require("@tailwindcss/typography"), require("@tailwindcss/forms")],
};
