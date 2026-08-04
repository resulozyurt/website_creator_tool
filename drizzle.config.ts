import "dotenv/config";
import type { Config } from "drizzle-kit";

/**
 * Drizzle Kit configuration.
 *
 * Migrations run against the direct (non-pooled) Neon connection. Set
 * `DATABASE_URL_UNPOOLED` in your environment (see `.env.example`) before running
 * `npm run db:generate` / `npm run db:migrate`.
 */
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "Missing DATABASE_URL_UNPOOLED (or DATABASE_URL) for drizzle-kit. See .env.example.",
  );
}

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
} satisfies Config;
