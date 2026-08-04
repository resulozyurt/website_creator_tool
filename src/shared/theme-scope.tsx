import type { ReactNode } from "react";
import { themeTokensToStyle } from "./theme";

export interface ThemeScopeProps {
  /** Tenant theme tokens (typically `sites.theme_tokens`). */
  tokens?: Readonly<Record<string, unknown>> | null;
  className?: string;
  children: ReactNode;
}

/**
 * Wraps a subtree in an element that carries the tenant's theme tokens as CSS variables, so
 * every block inside re-themes to the active tenant. Public tenant pages (Step 6) render their
 * block tree inside a `ThemeScope`.
 */
export function ThemeScope({ tokens, className, children }: ThemeScopeProps): ReactNode {
  return (
    <div className={className} style={themeTokensToStyle(tokens)}>
      {children}
    </div>
  );
}
