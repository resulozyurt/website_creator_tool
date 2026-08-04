/**
 * Public surface of the tenancy module.
 *
 * Feature code should import `forTenant` from here and never touch the raw db client.
 *
 * NOTE: this barrel re-exports `tenant-resolver`, which imports the `node-postgres` db client
 * and is therefore NOT edge-safe. Edge-runtime code (middleware) must import the pure host
 * parser directly from `@/tenancy/hostname`, never through this barrel.
 */
export * from "./context";
export * from "./tenant-scoped-db";
export * from "./hostname";
export * from "./tenant-resolver";
