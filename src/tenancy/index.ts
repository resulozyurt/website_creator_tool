/**
 * Public surface of the tenancy module.
 *
 * Feature code should import `forTenant` from here and never touch the raw db client.
 */
export * from "./context";
export * from "./tenant-scoped-db";
