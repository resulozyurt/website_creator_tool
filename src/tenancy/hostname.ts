/**
 * Hostname parsing and routing decisions — the FIRST half of tenant resolution.
 *
 * This module is deliberately **pure and edge-safe**: no database access, no Node APIs,
 * no imports of the db client. It runs inside Next.js middleware (Edge runtime), where the
 * `node-postgres` driver cannot run. Its job is to turn an incoming `Host` header into a
 * routing decision. The actual database lookup of which tenant owns a hostname happens later,
 * in a Node-runtime server component/route handler, via `resolveTenantByHostname`.
 *
 * IMPORTANT: import this file directly (`@/tenancy/hostname`). Do NOT import it through the
 * `@/tenancy` barrel, which also pulls in the db-backed resolver and would break the Edge
 * bundle.
 */

/** The kind of host we received, which decides how the request is routed. */
export type HostKind = "root" | "subdomain" | "custom" | "invalid";

export interface HostRouting {
  /**
   * - `root`     — the marketing/admin app itself (apex, `www`, a reserved label, or localhost).
   * - `subdomain`— a free tenant site on `<label>.<rootDomain>` (or `<label>.localhost` in dev).
   * - `custom`   — a bring-your-own domain (resolved against the `domains` table; Phase 2).
   * - `invalid`  — an empty or malformed host we refuse to route (middleware returns 404).
   */
  readonly kind: HostKind;
  /** The normalized hostname: lowercased, port stripped, trailing dot removed. */
  readonly hostname: string;
  /** The subdomain label, present only when `kind === "subdomain"`. */
  readonly subdomain?: string;
}

/**
 * Labels that belong to the platform itself, never to a tenant. A request to
 * `app.fieldpie.site` or `api.fieldpie.site` is routed as `root` (the app), not as a tenant
 * site. Keep this list in sync with any real platform subdomains you provision.
 */
export const RESERVED_SUBDOMAINS: ReadonlySet<string> = new Set([
  "www",
  "app",
  "admin",
  "api",
  "auth",
  "assets",
  "static",
  "cdn",
  "media",
  "mail",
  "status",
]);

const LOCAL_ROOT_HOSTS: ReadonlySet<string> = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
const LOCAL_SUFFIX = ".localhost";

/** A single DNS label: letters, digits, and hyphens (not leading/trailing). */
const LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/**
 * Normalize a raw `Host` header value: strip the port, lowercase, and drop a trailing dot.
 * Returns an empty string for nullish/blank input.
 */
export function normalizeHostname(rawHost: string | null | undefined): string {
  if (!rawHost) return "";
  let host = rawHost.trim().toLowerCase();
  if (!host) return "";

  // Strip the port. Bracketed IPv6 hosts (`[::1]:3000`) keep their brackets; everything else
  // splits on the last colon that is not inside brackets.
  if (host.startsWith("[")) {
    const closing = host.indexOf("]");
    if (closing !== -1) {
      host = host.slice(0, closing + 1);
    }
  } else {
    const colon = host.indexOf(":");
    if (colon !== -1) {
      host = host.slice(0, colon);
    }
  }

  // Drop a single trailing dot (fully-qualified form, e.g. "acme.fieldpie.site.").
  if (host.endsWith(".")) {
    host = host.slice(0, -1);
  }

  return host;
}

/** Whether every dot-separated label in `label` is a syntactically valid DNS label. */
function isValidSubdomainLabel(label: string): boolean {
  return label.length > 0 && !label.includes(".") && LABEL_PATTERN.test(label);
}

/**
 * Turn a raw `Host` header into a routing decision.
 *
 * @param rawHost    the incoming `Host` header (may include a port).
 * @param rootDomain the platform root domain that serves free subdomains,
 *                   e.g. "fieldpie.site". Defaults to `NEXT_PUBLIC_ROOT_DOMAIN`.
 */
export function parseHost(
  rawHost: string | null | undefined,
  rootDomain: string = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "fieldpie.site",
): HostRouting {
  const hostname = normalizeHostname(rawHost);
  const root = normalizeHostname(rootDomain);

  if (!hostname) {
    return { kind: "invalid", hostname: "" };
  }

  // --- Local development: localhost and *.localhost ---
  if (LOCAL_ROOT_HOSTS.has(hostname)) {
    return { kind: "root", hostname };
  }
  if (hostname.endsWith(LOCAL_SUFFIX)) {
    const label = hostname.slice(0, -LOCAL_SUFFIX.length);
    if (!label || RESERVED_SUBDOMAINS.has(label)) {
      return { kind: "root", hostname };
    }
    if (!isValidSubdomainLabel(label)) {
      return { kind: "invalid", hostname };
    }
    return { kind: "subdomain", hostname, subdomain: label };
  }

  // --- The platform root domain and its www alias serve the app itself ---
  if (root && (hostname === root || hostname === `www.${root}`)) {
    return { kind: "root", hostname };
  }

  // --- A free tenant subdomain on the root domain ---
  if (root && hostname.endsWith(`.${root}`)) {
    const label = hostname.slice(0, -(root.length + 1));
    if (RESERVED_SUBDOMAINS.has(label)) {
      return { kind: "root", hostname };
    }
    // Reject multi-level labels (e.g. "a.b.fieldpie.site") — we only serve single-label
    // subdomains, so anything with an inner dot is malformed for our purposes.
    if (!isValidSubdomainLabel(label)) {
      return { kind: "invalid", hostname };
    }
    return { kind: "subdomain", hostname, subdomain: label };
  }

  // --- Anything else is a candidate bring-your-own custom domain (resolved in Phase 2) ---
  // Require at least one dot so bare tokens and internal hostnames don't masquerade as domains.
  if (hostname.includes(".") && !hostname.endsWith(".")) {
    return { kind: "custom", hostname };
  }

  return { kind: "invalid", hostname };
}
