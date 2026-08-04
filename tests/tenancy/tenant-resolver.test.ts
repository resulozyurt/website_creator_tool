import { describe, expect, it } from "vitest";
import { tenantByHostnameQuery } from "@/tenancy/tenant-resolver";

/**
 * Offline SQL proof for the hostname → tenant resolver. Like the tenant-scoped-db tests, this
 * inspects the generated SQL via `.toSQL()` and never opens a database connection. It asserts
 * that resolution keys on the normalized hostname and only returns routable domains
 * (subdomains, or custom domains whose verification is active).
 */

describe("tenantByHostnameQuery", () => {
  it("filters by the normalized hostname", () => {
    const { sql, params } = tenantByHostnameQuery("ACME.FieldPie.Site").toSQL();
    expect(sql).toContain('"hostname"');
    expect(params).toContain("acme.fieldpie.site");
  });

  it("queries the domains table", () => {
    const { sql } = tenantByHostnameQuery("acme.fieldpie.site").toSQL();
    expect(sql).toContain('"domains"');
  });

  it("restricts to routable domains (subdomain or active custom)", () => {
    const { sql, params } = tenantByHostnameQuery("acme.fieldpie.site").toSQL();
    // The OR branch keys on the domain type and the verification status.
    expect(sql).toContain('"type"');
    expect(sql).toContain('"verification_status"');
    expect(params).toContain("subdomain");
    expect(params).toContain("active");
  });

  it("limits to a single row", () => {
    const { sql, params } = tenantByHostnameQuery("acme.fieldpie.site").toSQL();
    expect(sql.toLowerCase()).toContain("limit");
    expect(params).toContain(1);
  });
});
