import { describe, expect, it } from "vitest";
import { forTenant } from "@/tenancy";

/**
 * Isolation proof: these tests inspect the SQL that the tenant-scoped layer generates and
 * assert that the tenant filter is always present and that inserts always carry the scoped
 * tenant id. They run fully offline (no database connection) via drizzle's `.toSQL()`.
 */

const TENANT_A = "11111111-1111-1111-1111-111111111111";
const TENANT_B = "22222222-2222-2222-2222-222222222222";
const SOME_ID = "33333333-3333-3333-3333-333333333333";

describe("TenantScopedDb", () => {
  it("requires a tenant id", () => {
    expect(() => forTenant("")).toThrow();
  });

  describe("reads are scoped by tenant_id", () => {
    it("findMany filters by tenant_id", () => {
      const { sql, params } = forTenant(TENANT_A).sites.findMany().toSQL();
      expect(sql).toContain('"tenant_id"');
      expect(params).toContain(TENANT_A);
    });

    it("findById filters by both tenant_id and id", () => {
      const { sql, params } = forTenant(TENANT_A).pages.findById(SOME_ID).toSQL();
      expect(sql).toContain('"tenant_id"');
      expect(params).toContain(TENANT_A);
      expect(params).toContain(SOME_ID);
    });
  });

  describe("writes are scoped by tenant_id", () => {
    it("insert forces tenant_id even when omitted by the caller", () => {
      const { params } = forTenant(TENANT_A)
        .sites.create({ name: "Acme Plumbing" })
        .toSQL();
      expect(params).toContain(TENANT_A);
    });

    it("insert overrides a caller-supplied tenant id", () => {
      const { params } = forTenant(TENANT_A)
        // @ts-expect-error tenantId is intentionally not part of the create() input type.
        .sites.create({ name: "Acme", tenantId: TENANT_B })
        .toSQL();
      expect(params).toContain(TENANT_A);
      expect(params).not.toContain(TENANT_B);
    });

    it("update filters by tenant_id", () => {
      const { sql, params } = forTenant(TENANT_A)
        .sites.update(SOME_ID, { name: "Renamed" })
        .toSQL();
      expect(sql).toContain('"tenant_id"');
      expect(params).toContain(TENANT_A);
    });

    it("delete filters by tenant_id", () => {
      const { sql, params } = forTenant(TENANT_A).sites.remove(SOME_ID).toSQL();
      expect(sql).toContain('"tenant_id"');
      expect(params).toContain(TENANT_A);
    });
  });

  it("two tenants never share a scope", () => {
    const a = forTenant(TENANT_A).blocks.findMany().toSQL();
    const b = forTenant(TENANT_B).blocks.findMany().toSQL();
    expect(a.params).toContain(TENANT_A);
    expect(a.params).not.toContain(TENANT_B);
    expect(b.params).toContain(TENANT_B);
    expect(b.params).not.toContain(TENANT_A);
  });

  it("covers every tenant-scoped repository", () => {
    const t = forTenant(TENANT_A);
    for (const repo of [t.sites, t.pages, t.blocks, t.domains, t.mediaAssets, t.publishStates]) {
      const { sql, params } = repo.findMany().toSQL();
      expect(sql).toContain('"tenant_id"');
      expect(params).toContain(TENANT_A);
    }
  });
});
