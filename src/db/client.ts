import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
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

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });

export type Database = typeof db;
