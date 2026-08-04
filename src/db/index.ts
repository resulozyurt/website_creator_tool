/**
 * Public surface of the `db` module.
 *
 * Re-exports the schema (tables, enums, inferred types). The raw `db` client is
 * intentionally NOT re-exported here to discourage un-scoped access; import it from
 * `./client` only inside the tenancy layer and migration/seed scripts.
 */
export * from "./schema";
export type { Database } from "./client";
