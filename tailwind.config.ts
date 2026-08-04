import type { Config } from "tailwindcss";

/**
 * Design-token layer.
 *
 * Per-tenant theming is driven by CSS variables defined in app/globals.css and
 * overridden at runtime from each tenant's `theme_tokens`. Tailwind reads those
 * variables here so utility classes such as `bg-brand` or `font-sans` resolve to
 * the active tenant's brand values without recompiling CSS.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--color-brand)",
          foreground: "var(--color-brand-foreground)",
        },
        surface: "var(--color-surface)",
        ink: "var(--color-ink)",
        muted: "var(--color-muted)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "var(--font-sans)", "sans-serif"],
      },
      borderRadius: {
        token: "var(--radius)",
      },
    },
  },
  plugins: [],
};

export default config;
