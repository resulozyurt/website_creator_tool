import { describe, expect, it } from "vitest";
import { normalizeHostname, parseHost } from "@/tenancy/hostname";

/**
 * Pure, offline tests for hostname parsing. This is the edge-safe half of tenant resolution,
 * so it must never touch the database. Every case pins the root domain explicitly so the
 * result does not depend on environment configuration.
 */

const ROOT = "fieldpie.site";

describe("normalizeHostname", () => {
  it("lowercases, strips the port, and drops a trailing dot", () => {
    expect(normalizeHostname("Acme.FieldPie.Site:3000")).toBe("acme.fieldpie.site");
    expect(normalizeHostname("acme.fieldpie.site.")).toBe("acme.fieldpie.site");
  });

  it("returns an empty string for nullish or blank input", () => {
    expect(normalizeHostname(undefined)).toBe("");
    expect(normalizeHostname(null)).toBe("");
    expect(normalizeHostname("   ")).toBe("");
  });

  it("keeps IPv6 brackets while removing the port", () => {
    expect(normalizeHostname("[::1]:3000")).toBe("[::1]");
  });
});

describe("parseHost — root domain", () => {
  it("treats the apex and www as the app itself", () => {
    expect(parseHost("fieldpie.site", ROOT)).toEqual({ kind: "root", hostname: "fieldpie.site" });
    expect(parseHost("www.fieldpie.site", ROOT)).toEqual({
      kind: "root",
      hostname: "www.fieldpie.site",
    });
  });

  it("routes reserved subdomains to the app, not to a tenant", () => {
    for (const label of ["app", "api", "admin", "auth", "cdn"]) {
      const result = parseHost(`${label}.fieldpie.site`, ROOT);
      expect(result.kind).toBe("root");
    }
  });

  it("treats localhost and 127.0.0.1 as root in development", () => {
    expect(parseHost("localhost:3000", ROOT).kind).toBe("root");
    expect(parseHost("127.0.0.1:3000", ROOT).kind).toBe("root");
  });
});

describe("parseHost — tenant subdomain", () => {
  it("extracts a single-label subdomain on the root domain", () => {
    expect(parseHost("acme.fieldpie.site", ROOT)).toEqual({
      kind: "subdomain",
      hostname: "acme.fieldpie.site",
      subdomain: "acme",
    });
  });

  it("is case-insensitive and port-insensitive", () => {
    expect(parseHost("ACME.FieldPie.Site:8080", ROOT)).toEqual({
      kind: "subdomain",
      hostname: "acme.fieldpie.site",
      subdomain: "acme",
    });
  });

  it("supports *.localhost for local development", () => {
    expect(parseHost("acme.localhost:3000", ROOT)).toEqual({
      kind: "subdomain",
      hostname: "acme.localhost",
      subdomain: "acme",
    });
  });

  it("accepts hyphenated labels", () => {
    expect(parseHost("acme-plumbing.fieldpie.site", ROOT)).toMatchObject({
      kind: "subdomain",
      subdomain: "acme-plumbing",
    });
  });
});

describe("parseHost — custom and invalid hosts", () => {
  it("classifies an unrelated registrable domain as custom (BYO, Phase 2)", () => {
    expect(parseHost("acmeplumbing.com", ROOT)).toEqual({
      kind: "custom",
      hostname: "acmeplumbing.com",
    });
  });

  it("rejects multi-level labels under the root domain as invalid", () => {
    expect(parseHost("a.b.fieldpie.site", ROOT).kind).toBe("invalid");
  });

  it("rejects an empty host as invalid", () => {
    expect(parseHost("", ROOT).kind).toBe("invalid");
    expect(parseHost(undefined, ROOT).kind).toBe("invalid");
  });

  it("rejects a bare single-token host as invalid", () => {
    expect(parseHost("internal", ROOT).kind).toBe("invalid");
  });

  it("rejects labels with illegal characters", () => {
    expect(parseHost("acme_co.fieldpie.site", ROOT).kind).toBe("invalid");
  });
});
