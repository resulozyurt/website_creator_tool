import { and, eq, or } from "drizzle-orm";
import { db as defaultDb, type Database } from "@/db/client";
import { domains } from "@/db/schema";
import { normalizeHostname } from "./hostname";

/**
 * Hostname → tenant resolution — the SECOND half of tenant resolution (Node runtime only).
 *
 * This is a **bootstrap, cross-tenant lookup**: at this point we do not yet know which tenant
 * a request belongs to, so it legitimately uses the raw db client rather than the
 * tenant-scoped layer (`forTenant`). It is one of the few sanctioned consumers of the raw
 * client, alongside migrations/seed scripts. Everything downstream — once a `tenantId` is
 * known — must go back through `forTenant`.
 *
 * The `node-postgres` driver does not run on the Edge runtime, so this must be called from a
 * Node-runtime context (a server component or route handler), never from middleware.
 */

export interface ResolvedTenant {
  readonly tenantId: string;
  readonly siteId: string;
  readonly domainId: string;
  readonly hostname: string;
  readonly type: "subdomain" | "custom";
}

/**
 * The drizzle query that maps a hostname to its owning tenant/site.
 *
 * A domain is routable when it is either a free subdomain (always usable once created) or a
 * custom domain whose verification has completed (`verification_status = 'active'`). This is
 * exposed separately from `resolveTenantByHostname` so tests can inspect the generated SQL
 * offline via `.toSQL()` without opening a database connection.
 */
export function tenantByHostnameQuery(hostname: string, database: Database = defaultDb) {
  const normalized = normalizeHostname(hostname);
  return database
    .select({
      tenantId: domains.tenantId,
      siteId: domains.siteId,
      domainId: domains.id,
      hostname: domains.hostname,
      type: domains.type,
    })
    .from(domains)
    .where(
      and(
        eq(domains.hostname, normalized),
        or(eq(domains.type, "subdomain"), eq(domains.verificationStatus, "active")),
      ),
    )
    .limit(1);
}

/**
 * Resolve a hostname to its owning tenant/site, or `null` if no routable domain matches.
 * Callers (e.g. the public site route) should treat `null` as a 404.
 */
export async function resolveTenantByHostname(
  hostname: string,
  database: Database = defaultDb,
): Promise<ResolvedTenant | null> {
  const normalized = normalizeHostname(hostname);
  if (!normalized) return null;

  const rows = await tenantByHostnameQuery(normalized, database);
  const row = rows[0];
  return row ?? null;
}
