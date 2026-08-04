import type { CSSProperties } from "react";

/**
 * Per-tenant theming.
 *
 * Blocks never hardcode colors or fonts — they use the Tailwind token utilities (`bg-brand`,
 * `text-ink`, `font-heading`, `rounded-token`, …), which resolve to CSS variables. A tenant's
 * saved `theme_tokens` are applied as inline CSS variables on a wrapping element, so the same
 * compiled components re-theme per tenant with no rebuild. The platform defaults for these
 * variables live in `app/globals.css`.
 */

/** The tenant-controllable theme tokens. All optional; unset tokens fall back to the defaults. */
export interface ThemeTokens {
  /** Primary brand color (buttons, accents). CSS `--color-brand`. */
  brand?: string;
  /** Foreground color used on top of the brand color. CSS `--color-brand-foreground`. */
  brandForeground?: string;
  /** Page/background surface color. CSS `--color-surface`. */
  surface?: string;
  /** Primary text color. CSS `--color-ink`. */
  ink?: string;
  /** Secondary/muted text color. CSS `--color-muted`. */
  muted?: string;
  /** Body font stack. CSS `--font-sans`. */
  fontSans?: string;
  /** Heading font stack. CSS `--font-heading`. */
  fontHeading?: string;
  /** Corner radius for themed surfaces. CSS `--radius`. */
  radius?: string;
}

/** Maps each theme-token key to the CSS custom property it drives. Keep in sync with globals.css. */
const TOKEN_TO_CSS_VAR = {
  brand: "--color-brand",
  brandForeground: "--color-brand-foreground",
  surface: "--color-surface",
  ink: "--color-ink",
  muted: "--color-muted",
  fontSans: "--font-sans",
  fontHeading: "--font-heading",
  radius: "--radius",
} as const satisfies Record<keyof ThemeTokens, `--${string}`>;

const TOKEN_KEYS = Object.keys(TOKEN_TO_CSS_VAR) as (keyof ThemeTokens)[];

/**
 * Convert a tenant's stored theme tokens into an inline style object of CSS variables.
 *
 * The input is intentionally loose (`Record<string, unknown>`) because it comes straight from
 * the `sites.theme_tokens` JSON column. Only recognized keys with string values are emitted;
 * everything else is ignored, so arbitrary stored JSON can never inject unexpected properties.
 */
export function themeTokensToStyle(
  tokens: Readonly<Record<string, unknown>> | null | undefined,
): CSSProperties {
  const style: Record<string, string> = {};
  if (!tokens) return style;

  for (const key of TOKEN_KEYS) {
    const value = tokens[key];
    if (typeof value === "string" && value.trim() !== "") {
      style[TOKEN_TO_CSS_VAR[key]] = value;
    }
  }
  return style;
}
