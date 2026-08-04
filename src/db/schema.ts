import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Database schema — FieldPie Website Builder.
 *
 * Tenant isolation: every tenant-scoped table carries `tenant_id` directly
 * (denormalized on purpose) so isolation never depends on a join being correct.
 * All tenant reads/writes go through the tenant-scoped data-access layer (Step 3);
 * the raw client in `client.ts` is internal to this module.
 *
 * Draft vs. published content: a page has exactly one `draft` blocks row (upserted
 * as the tenant edits) and zero or more versioned `published` blocks rows. Publishing
 * copies the draft into a new `published` row with an incremented `version`; the live
 * snapshot is the highest-version published row, also recorded in `publish_states`.
 * This deliberately replaces the plan's draft/published pointer columns to avoid a
 * circular foreign key between `pages` and `blocks`.
 */

/* -------------------------------------------------------------------------- */
/* Enums                                                                      */
/* -------------------------------------------------------------------------- */

export const tenantStatus = pgEnum("tenant_status", ["active", "suspended"]);
export const domainType = pgEnum("domain_type", ["subdomain", "custom"]);
export const verificationStatus = pgEnum("verification_status", [
  "pending",
  "verifying",
  "active",
  "failed",
]);
export const sslStatus = pgEnum("ssl_status", ["none", "pending", "active", "failed"]);
export const blockKind = pgEnum("block_kind", ["draft", "published"]);
export const mediaSource = pgEnum("media_source", ["fieldpie", "upload"]);

/* -------------------------------------------------------------------------- */
/* Shared column helpers                                                      */
/* -------------------------------------------------------------------------- */

const createdAt = timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();

/* -------------------------------------------------------------------------- */
/* tenants — one row per builder customer (not necessarily a FieldPie account) */
/* -------------------------------------------------------------------------- */

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Nullable: a tenant may exist without a linked FieldPie account.
  fieldpieAccountId: text("fieldpie_account_id"),
  name: text("name").notNull(),
  status: tenantStatus("status").notNull().default("active"),
  createdAt,
  updatedAt,
});

/* -------------------------------------------------------------------------- */
/* templates — reusable starter layouts for the "pick a template" init path   */
/* -------------------------------------------------------------------------- */

export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  industry: text("industry"),
  thumbnailUrl: text("thumbnail_url"),
  // Starter section tree in the same block-JSON model as page content.
  blocks: jsonb("blocks").$type<Record<string, unknown>>().notNull(),
  isSystem: boolean("is_system").notNull().default(true),
  createdAt,
});

/* -------------------------------------------------------------------------- */
/* sites — one site per tenant (schema allows more than one later)            */
/* -------------------------------------------------------------------------- */

export const sites = pgTable(
  "sites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    defaultLocale: text("default_locale").notNull().default("en"),
    // Per-tenant brand tokens (colors, fonts, logo) applied as CSS variables.
    themeTokens: jsonb("theme_tokens").$type<Record<string, unknown>>().notNull().default({}),
    seoDefaults: jsonb("seo_defaults").$type<Record<string, unknown>>().notNull().default({}),
    createdAt,
    updatedAt,
  },
  (t) => [index("sites_tenant_id_idx").on(t.tenantId)],
);

/* -------------------------------------------------------------------------- */
/* pages — pages within a site                                                */
/* -------------------------------------------------------------------------- */

export const pages = pgTable(
  "pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    title: text("title"),
    seo: jsonb("seo").$type<Record<string, unknown>>().notNull().default({}),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex("pages_site_id_path_uq").on(t.siteId, t.path),
    index("pages_tenant_id_idx").on(t.tenantId),
  ],
);

/* -------------------------------------------------------------------------- */
/* blocks — the block-JSON tree for a page, versioned (draft or published)    */
/* -------------------------------------------------------------------------- */

export const blocks = pgTable(
  "blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    kind: blockKind("kind").notNull(),
    version: integer("version").notNull().default(1),
    // The portable component tree produced by the editor (Puck).
    content: jsonb("content").$type<Record<string, unknown>>().notNull(),
    createdAt,
  },
  (t) => [
    // Exactly one draft row per page; published rows are versioned and unbounded.
    uniqueIndex("blocks_draft_per_page_uq")
      .on(t.pageId)
      .where(sql`${t.kind} = 'draft'`),
    index("blocks_page_kind_version_idx").on(t.pageId, t.kind, t.version),
    index("blocks_tenant_id_idx").on(t.tenantId),
  ],
);

/* -------------------------------------------------------------------------- */
/* domains — hostname → tenant/site mapping (drives middleware resolution)     */
/* -------------------------------------------------------------------------- */

export const domains = pgTable(
  "domains",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    hostname: text("hostname").notNull(),
    type: domainType("type").notNull(),
    verificationStatus: verificationStatus("verification_status").notNull().default("pending"),
    cloudflareHostnameId: text("cloudflare_hostname_id"),
    sslStatus: sslStatus("ssl_status").notNull().default("none"),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex("domains_hostname_uq").on(t.hostname),
    index("domains_tenant_id_idx").on(t.tenantId),
    index("domains_site_id_idx").on(t.siteId),
  ],
);

/* -------------------------------------------------------------------------- */
/* media_assets — references to objects in S3-compatible storage              */
/* -------------------------------------------------------------------------- */

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull(),
    url: text("url").notNull(),
    altText: text("alt_text"),
    width: integer("width"),
    height: integer("height"),
    mimeType: text("mime_type"),
    source: mediaSource("source").notNull().default("upload"),
    createdAt,
  },
  (t) => [
    index("media_assets_tenant_id_idx").on(t.tenantId),
    index("media_assets_site_id_idx").on(t.siteId),
  ],
);

/* -------------------------------------------------------------------------- */
/* publish_states — audit/version log of publish events (enables rollback)    */
/* -------------------------------------------------------------------------- */

export const publishStates = pgTable(
  "publish_states",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    publishedBlocksId: uuid("published_blocks_id")
      .notNull()
      .references(() => blocks.id, { onDelete: "restrict" }),
    publishedBy: text("published_by"),
    publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull(),
    note: text("note"),
  },
  (t) => [
    index("publish_states_page_published_at_idx").on(t.pageId, t.publishedAt),
    index("publish_states_tenant_id_idx").on(t.tenantId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Inferred types                                                             */
/* -------------------------------------------------------------------------- */

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
export type Block = typeof blocks.$inferSelect;
export type NewBlock = typeof blocks.$inferInsert;
export type Domain = typeof domains.$inferSelect;
export type NewDomain = typeof domains.$inferInsert;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type NewMediaAsset = typeof mediaAssets.$inferInsert;
export type PublishState = typeof publishStates.$inferSelect;
export type NewPublishState = typeof publishStates.$inferInsert;
