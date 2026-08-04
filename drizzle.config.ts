import { config as loadEnv } from "dotenv";
import type { Config } from "drizzle-kit";

// Load local env for CLI runs. Next.js reads `.env.local` automatically, but
// drizzle-kit runs as a plain Node script, so we load it explicitly here.
// `.env.local` takes priority; `.env` fills any gaps (neither overrides real env vars).
loadEnv({ path: ".env.local" });
loadEnv();

/**
 * Drizzle Kit configuration.
 *
 * `db:generate` needs no database connection (it only reads the schema and writes SQL).
 * `db:migrate` / `db:push` require DATABASE_URL to point at the running Railway Postgres.
 */
// Use `||` (not `??`) so an empty-string DATABASE_URL_UNPOOLED falls through to DATABASE_URL.
const url =
  process.env.DATABASE_URL_UNPOOLED?.trim() || process.env.DATABASE_URL?.trim() || "";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
} satisfies Config;
