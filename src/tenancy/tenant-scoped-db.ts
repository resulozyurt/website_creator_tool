import { and, eq, type SQL } from "drizzle-orm";
import { db as defaultDb, type Database } from "@/db/client";
import {
  blocks,
  domains,
  mediaAssets,
  pages,
  publishStates,
  sites,
  tenants,
  type NewBlock,
  type NewDomain,
  type NewMediaAsset,
  type NewPage,
  type NewPublishState,
  type NewSite,
} from "@/db/schema";

/**
 * Tenant-scoped data-access layer — the PRIMARY tenant-isolation control.
 *
 * Application code must go through `forTenant(tenantId)` to touch tenant data. Every read,
 * update, and delete is filtered by `tenant_id`, and every insert forces `tenant_id` to the
 * scoped tenant (any caller-supplied value is overridden). The raw `db` client is internal
 * to the `db` module and must not be imported by feature code.
 *
 * `templates` is intentionally NOT exposed here: it is global/system data with no `tenant_id`.
 */

type WithoutTenant<T> = Omit<T, "tenantId">;

/** Build `tenant_id = $tenant [AND extra]`. */
function scoped(tenantColumnEquals: SQL, extra?: SQL): SQL | undefined {
  return extra ? and(tenantColumnEquals, extra) : tenantColumnEquals;
}

function sitesRepo(db: Database, tenantId: string) {
  const tenant = eq(sites.tenantId, tenantId);
  return {
    findMany: (where?: SQL) => db.select().from(sites).where(scoped(tenant, where)),
    findById: (id: string) =>
      db.select().from(sites).where(and(tenant, eq(sites.id, id))).limit(1),
    create: (values: WithoutTenant<NewSite>) =>
      db.insert(sites).values({ ...values, tenantId }).returning(),
    update: (id: string, set: Partial<WithoutTenant<NewSite>>) =>
      db.update(sites).set(set).where(and(tenant, eq(sites.id, id))).returning(),
    remove: (id: string) =>
      db.delete(sites).where(and(tenant, eq(sites.id, id))).returning(),
  };
}

function pagesRepo(db: Database, tenantId: string) {
  const tenant = eq(pages.tenantId, tenantId);
  return {
    findMany: (where?: SQL) => db.select().from(pages).where(scoped(tenant, where)),
    findById: (id: string) =>
      db.select().from(pages).where(and(tenant, eq(pages.id, id))).limit(1),
    create: (values: WithoutTenant<NewPage>) =>
      db.insert(pages).values({ ...values, tenantId }).returning(),
    update: (id: string, set: Partial<WithoutTenant<NewPage>>) =>
      db.update(pages).set(set).where(and(tenant, eq(pages.id, id))).returning(),
    remove: (id: string) =>
      db.delete(pages).where(and(tenant, eq(pages.id, id))).returning(),
  };
}

function blocksRepo(db: Database, tenantId: string) {
  const tenant = eq(blocks.tenantId, tenantId);
  return {
    findMany: (where?: SQL) => db.select().from(blocks).where(scoped(tenant, where)),
    findById: (id: string) =>
      db.select().from(blocks).where(and(tenant, eq(blocks.id, id))).limit(1),
    create: (values: WithoutTenant<NewBlock>) =>
      db.insert(blocks).values({ ...values, tenantId }).returning(),
    update: (id: string, set: Partial<WithoutTenant<NewBlock>>) =>
      db.update(blocks).set(set).where(and(tenant, eq(blocks.id, id))).returning(),
    remove: (id: string) =>
      db.delete(blocks).where(and(tenant, eq(blocks.id, id))).returning(),
  };
}

function domainsRepo(db: Database, tenantId: string) {
  const tenant = eq(domains.tenantId, tenantId);
  return {
    findMany: (where?: SQL) => db.select().from(domains).where(scoped(tenant, where)),
    findById: (id: string) =>
      db.select().from(domains).where(and(tenant, eq(domains.id, id))).limit(1),
    create: (values: WithoutTenant<NewDomain>) =>
      db.insert(domains).values({ ...values, tenantId }).returning(),
    update: (id: string, set: Partial<WithoutTenant<NewDomain>>) =>
      db.update(domains).set(set).where(and(tenant, eq(domains.id, id))).returning(),
    remove: (id: string) =>
      db.delete(domains).where(and(tenant, eq(domains.id, id))).returning(),
  };
}

function mediaAssetsRepo(db: Database, tenantId: string) {
  const tenant = eq(mediaAssets.tenantId, tenantId);
  return {
    findMany: (where?: SQL) => db.select().from(mediaAssets).where(scoped(tenant, where)),
    findById: (id: string) =>
      db.select().from(mediaAssets).where(and(tenant, eq(mediaAssets.id, id))).limit(1),
    create: (values: WithoutTenant<NewMediaAsset>) =>
      db.insert(mediaAssets).values({ ...values, tenantId }).returning(),
    update: (id: string, set: Partial<WithoutTenant<NewMediaAsset>>) =>
      db.update(mediaAssets).set(set).where(and(tenant, eq(mediaAssets.id, id))).returning(),
    remove: (id: string) =>
      db.delete(mediaAssets).where(and(tenant, eq(mediaAssets.id, id))).returning(),
  };
}

function publishStatesRepo(db: Database, tenantId: string) {
  const tenant = eq(publishStates.tenantId, tenantId);
  return {
    findMany: (where?: SQL) => db.select().from(publishStates).where(scoped(tenant, where)),
    findById: (id: string) =>
      db.select().from(publishStates).where(and(tenant, eq(publishStates.id, id))).limit(1),
    create: (values: WithoutTenant<NewPublishState>) =>
      db.insert(publishStates).values({ ...values, tenantId }).returning(),
  };
}

/** The tenant's own row in `tenants`, scoped to its id. */
function tenantRepo(db: Database, tenantId: string) {
  const self = eq(tenants.id, tenantId);
  return {
    get: () => db.select().from(tenants).where(self).limit(1),
    update: (set: Partial<Omit<typeof tenants.$inferInsert, "id">>) =>
      db.update(tenants).set(set).where(self).returning(),
  };
}

export function forTenant(tenantId: string, database: Database = defaultDb) {
  if (!tenantId) {
    throw new Error("forTenant: tenantId is required.");
  }
  return {
    tenantId,
    tenant: tenantRepo(database, tenantId),
    sites: sitesRepo(database, tenantId),
    pages: pagesRepo(database, tenantId),
    blocks: blocksRepo(database, tenantId),
    domains: domainsRepo(database, tenantId),
    mediaAssets: mediaAssetsRepo(database, tenantId),
    publishStates: publishStatesRepo(database, tenantId),
  };
}

export type TenantScopedDb = ReturnType<typeof forTenant>;
