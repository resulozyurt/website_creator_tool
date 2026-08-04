/**
 * Request-scoped tenant context.
 *
 * The tenant is resolved once per request (from the hostname in middleware for public
 * pages, or from the authenticated session for admin routes — Step 4 / Step 11) and then
 * carried immutably for the rest of the request. Downstream code reads the tenant from
 * this context and never re-derives or overrides it.
 */
export interface TenantContext {
  readonly tenantId: string;
  readonly siteId?: string;
}

export function createTenantContext(tenantId: string, siteId?: string): TenantContext {
  if (!tenantId) {
    throw new Error("createTenantContext: tenantId is required.");
  }
  return Object.freeze(siteId ? { tenantId, siteId } : { tenantId });
}
