import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // A dummy connection string so `src/db/client.ts` imports without throwing. The pg Pool
    // is created but never connects — the isolation tests only inspect generated SQL via
    // `.toSQL()`, which does not touch the database.
    env: {
      DATABASE_URL: "postgres://test:test@localhost:5432/test",
    },
  },
});
