import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

/**
 * Raw database client — INTERNAL to the `db` module.
 *
 * This client is not tenant-scoped. Application code must not import it directly;
 * it goes through the tenant-scoped data-access layer (`src/tenancy`, Step 3), which
 * enforces `WHERE tenant_id = $current` on every read and write. The only permitted
 * consumers of the raw client are the tenancy layer and migrations/seed scripts.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing DATABASE_URL. See .env.example.");
}

// Railway Postgres. A single shared connection pool is reused across requests.
// SSL is controlled via the connection string (e.g. `?sslmode=require`) when the
// public endpoint requires it; the private/internal URL needs no SSL.
const pool = new Pool({ connectionString });

export const db = drizzle(pool, { schema });

export type Database = typeof db;
