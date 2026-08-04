# FieldPie Website Builder — Project Plan (v1, for approval)

**Status:** DRAFT (v1.1) — awaiting final approval. No implementation code has been written.
**Author:** Lead Architect (FieldPie Website Builder)
**Date:** 2026-08-04

> **v1.1 revision note.** Stack decisions (Puck, Neon, Drizzle, Vercel) are approved. Direction change: the product is now a **flexible, widget-style builder**, not a site auto-generated from FieldPie data. A tenant's offerings vary too much to seed reliably, so a new site is initialized one of three ways the tenant chooses — **starter template, AI content generation, or blank** — and FieldPie data is at most an optional prefill of low-variance fields. AI content generation lands as **Phase 1.5**. Auth is abstracted and the tenant is decoupled from a FieldPie account.
**Scope of this document:** End-to-end plan for a multi-tenant website builder that pre-populates tenant sites from existing FieldPie data, comparable to Jobber's website builder.

---

## 0. Executive Summary

We are building a **single-codebase, multi-tenant website builder**. One deployment serves thousands of tenant sites. Each tenant gets a free subdomain (`customer.fieldpie.site`) and can optionally connect a custom domain with automatic SSL. Site content is stored as **structured JSON** (not static HTML), edited through a visual block editor, and rendered server-side / statically for SEO and performance. The key differentiator is **speed-to-live through a flexible, widget-style builder**: the tenant assembles a site from a curated block set with drag-and-drop reordering, add/remove sections, and full control of colors and fonts. To avoid a cold start, a new site can be initialized three ways — **pick a starter template, generate content with AI, or start blank** — and the tenant chooses. Where FieldPie already holds low-variance data (e.g. business name, phone, address, hours), we can **optionally prefill** it, but site content is driven by the builder and AI, not auto-generated from the FieldPie account, because a tenant's offerings vary too much to seed reliably.

The recommended stack: **Next.js (App Router) + TypeScript strict**, **Puck** as the visual editor, **Neon** for Postgres, **Drizzle** as the ORM, and **Vercel** for early-stage hosting with a documented self-host migration path. **Cloudflare for SaaS** handles custom hostnames and SSL. Each of these has an explicit tradeoff writeup and a recommendation in Section 1, and each is listed in the final decision gate (Section 8).

This plan deliberately stops before implementation. Section 8 lists the exact decisions I need you to confirm before any code is written.

---

## 1. Tech Stack — Recommendations, Tradeoffs, and Decisions

For each open decision I give a recommendation, the reasoning, the main tradeoff, and what confirming it commits us to. These are the four decisions I most need locked before Phase 1.

### 1.1 Framework (already directionally set): Next.js App Router + React + TypeScript (strict)

Not an open decision, but stated for completeness. Next.js App Router gives us server components, static generation, per-route caching, and middleware — exactly the primitives multi-tenant SaaS site rendering needs. TypeScript strict mode is mandatory per our code standards; `any` requires written justification.

### 1.2 Visual Editor: **Puck** (recommended) vs GrapesJS

| Dimension | Puck | GrapesJS |
|---|---|---|
| Model | React-native; renders your own React components | Framework-agnostic; manipulates HTML/CSS in an iframe |
| Output | Clean, portable **JSON** describing a component tree | HTML + CSS strings (plus optional JSON of its own model) |
| Fit with Next.js/React | Native — editor and runtime share the same components | Adapter needed; you render its HTML output, not React |
| Design-system control | High — you define the allowed blocks and their props | Lower — freeform HTML/CSS invites drift from design tokens |
| Maturity/ecosystem | Younger, smaller community | Older, larger community, more plugins |
| Security surface | Props are structured data → easier to validate/sanitize | Freeform HTML/CSS → larger sanitization surface |
| Learning curve for our team | Low (it's just React components) | Medium (its own APIs and event model) |

**Recommendation: Puck.** Our product is intentionally constrained — a curated block set (hero, services, reviews, gallery, contact), not a freeform HTML canvas. Puck's model matches that exactly: we define a fixed catalog of React blocks, Puck persists a clean JSON tree, and the **same** components render the public site. That gives us one source of truth for a block, strong typing on block props, and a small, auditable sanitization surface. GrapesJS is more mature but optimizes for freeform HTML/CSS editing, which fights our design-token theming and enlarges the XSS surface.

**Main tradeoff:** Puck is younger and less battle-tested; we accept more responsibility for building block components and possibly contributing upstream fixes. This is acceptable because our block set is small and we want to own it anyway.

**Confirming Puck commits us to:** a component-catalog-driven editor, JSON-tree persistence, and building each block as a first-class React component used in both editor and runtime.

### 1.3 Postgres host: **Neon** (recommended) vs Supabase

| Dimension | Neon | Supabase |
|---|---|---|
| Core offering | Serverless Postgres (autoscaling, scale-to-zero, branching) | Postgres + Auth + Storage + Realtime + RLS + dashboard |
| DB branching | Yes — first-class (great for preview/migration testing) | Limited |
| Row-Level Security | Standard Postgres RLS available | RLS is central to its model and tooling |
| Auth | None (we use FieldPie auth anyway) | Built-in (we do **not** want a parallel auth system) |
| Storage | None (we use S3-compatible storage) | Built-in (we likely won't use it) |
| Serverless/edge fit | Excellent — driver designed for serverless | Good |
| Lock-in | Low — it's "just Postgres" | Higher — value is in the surrounding platform |

**Recommendation: Neon.** Our architecture already specifies FieldPie's existing auth (no parallel auth system) and an S3-compatible store for media. That removes the two biggest reasons to choose Supabase (its Auth and Storage). What remains is Postgres, and Neon is the cleaner, lower-lock-in, serverless-native Postgres with branching that will make migration testing and preview environments much safer. We enforce tenant isolation in our own data-access layer (Section 3), so we are not dependent on Supabase-flavored RLS tooling.

**Main tradeoff:** We forgo Supabase's all-in-one convenience (dashboard, instant REST, built-in RLS policies UI). Given we're not using its Auth/Storage, that convenience is largely redundant for us.

**Note on RLS:** Choosing Neon does not stop us from adding Postgres RLS as defense-in-depth later. Our primary isolation guarantee is the application data-access layer; RLS can be layered on top.

**Confirming Neon commits us to:** application-enforced tenant isolation as the primary control, S3-compatible media storage, and FieldPie auth (all already in our standards).

### 1.4 ORM / query layer: **Drizzle** (recommended) vs Prisma

| Dimension | Drizzle | Prisma |
|---|---|---|
| Style | SQL-first, thin, TypeScript-native query builder | Schema-DSL + generated client, higher abstraction |
| Serverless/edge cold-start | Very light; excellent | Historically heavier engine; improving but larger |
| Type inference | Direct from schema, no codegen step required | Requires `prisma generate` codegen |
| Multi-tenant filtering | Explicit SQL → easy to force `tenant_id` in a wrapper | Possible, but abstraction can hide the filter |
| Migrations | `drizzle-kit` (SQL-visible) | Prisma Migrate (mature, polished) |
| Ecosystem/maturity | Younger, fast-growing | Very mature, large ecosystem, great DX |
| Raw SQL escape hatch | First-class, ergonomic | Available but less central |

**Recommendation: Drizzle.** For a serverless, multi-tenant app, Drizzle's SQL-first, low-overhead model is the better fit. It plays well with Neon's serverless driver, has minimal cold-start cost, and — critically for our **hard rule that every tenant-scoped query filters by `tenant_id`** — keeps queries explicit and easy to wrap in a mandatory tenant-scoped data-access layer. Prisma's higher abstraction is excellent DX but can obscure exactly the filter we must never omit.

**Main tradeoff:** Prisma has more mature migrations and a larger ecosystem; Drizzle asks the team to be comfortable closer to SQL. Our team standard already values explicit, auditable data access, so this is a fair trade.

**Confirming Drizzle commits us to:** SQL-visible migrations via drizzle-kit and a `TenantScopedDb` wrapper (Section 3) as the single enforced entry point for tenant data.

### 1.5 Hosting: **Vercel now**, documented self-host path later (recommended)

| Dimension | Vercel (early stage) | Self-hosted VPS + Cloudflare CDN (scale) |
|---|---|---|
| Time to ship | Fastest — native Next.js, zero infra work | Slower — we own the ops |
| Multi-tenant middleware | First-class support | We run/scale it ourselves |
| Custom domains at scale | Works, but per-domain cost/limits add up | Cheaper per domain at high volume |
| Cost curve | Low at small scale, steepens with traffic/domains | Higher upfront effort, cheaper at scale |
| Control | Less infra control | Full control |

**Recommendation: Start on Vercel; document (do not build) the self-host migration path now.** Vercel gets Phase 1 shipped fastest with native App Router, middleware, and static generation. We write down the migration path (containerized Next.js on a VPS behind Cloudflare CDN, with Cloudflare for SaaS unchanged) so cost-control-at-scale is a planned lever, not a rewrite. Because published sites are statically generated and CDN-cached (Section 2), visitor traffic mostly bypasses origin regardless of host, which softens Vercel's cost curve and makes the eventual migration lower-risk.

**Main tradeoff:** Vercel cost rises with custom-domain count and traffic; we accept that early for speed, with the migration path as our pressure-release valve.

**Confirming Vercel commits us to:** shipping Phase 1 on Vercel, keeping the app portable (no hard Vercel-only lock-in beyond hosting), and treating self-host as a documented Phase 4 option.

### 1.6 Supporting choices (not open decisions, stated for the record)

Styling is **Tailwind CSS** with a **design-token layer** for per-tenant theming (brand colors, fonts, logo injected as CSS variables). Media lives in an **S3-compatible object store** behind a CDN. Custom domains/SSL use **Cloudflare for SaaS** (Section 4). User-authored content is sanitized (e.g., DOMPurify + a strict allowlist) before storage/render. Public tenant pages are always server/statically rendered — never client-only — because SEO is a core selling point.

---

## 2. High-Level System Architecture

Two pipelines matter: the **visitor read path** and the **editor → publish write path**. A third concern — **initializing a new site** (template, AI, or blank) — feeds the write path at tenant onboarding.

### 2.1 Visitor request flow (hostname → tenant → content → render)

```
Visitor
  │  GET https://acme-plumbing.com/services   (or acme.fieldpie.site/services)
  ▼
CDN edge (cache)
  │  cache HIT  ──────────────► serve cached static HTML  (origin not hit)
  │  cache MISS
  ▼
Next.js middleware  ── resolves Host header → tenant
  │   1. read Host header
  │   2. look up domain in `domains` table (custom domain OR *.fieldpie.site subdomain)
  │   3. map → tenant_id (+ site_id)
  │   4. attach tenant context to the request; 404 if unknown host
  ▼
Route handler / Server Component
  │   5. load PUBLISHED site + page JSON for (tenant_id, path)   [tenant-scoped query]
  │   6. resolve design tokens (brand colors/fonts/logo) → CSS variables
  │   7. render Puck JSON tree → HTML with the shared block components
  │   8. inject SEO scaffolding (title, meta, OG, LocalBusiness JSON-LD)
  ▼
Static HTML response  → cached at CDN edge for subsequent visitors
```

Key properties: **tenant resolution happens once in middleware**; every downstream data read is tenant-scoped; visitor traffic is served from the CDN so the origin is rarely touched; only the **published** state is ever visible to visitors.

### 2.2 Editor → JSON storage → publish → live pipeline

```
Tenant admin (authenticated via FieldPie auth/session)
  │  opens the site editor for their tenant
  ▼
Editor (Puck)  ── loads DRAFT page JSON for the tenant
  │   edits blocks; autosave writes DRAFT JSON  (draft never affects live site)
  ▼
`pages`/`blocks` DRAFT state in Postgres  (tenant-scoped writes, sanitized content)
  │
  │  tenant clicks "Publish"
  ▼
Publish action
  │   1. validate + sanitize draft content
  │   2. copy DRAFT → PUBLISHED snapshot (versioned in `publish_states`)
  │   3. trigger revalidation of affected static paths (ISR/on-demand revalidate)
  │   4. purge CDN cache for those paths
  ▼
Live site now serves the new PUBLISHED snapshot
```

**Strict draft/published separation** is a hard requirement: editing writes only to draft; visitors only ever see the last published snapshot. Publish is an explicit, atomic, versioned promotion (so we can support rollback later).

### 2.3 Initializing a new site (template, AI, or blank)

When a tenant creates a site they choose how to start. We never force a blank page, but we also never assume the whole site can be derived from FieldPie data — a tenant's offerings vary too much. All three strategies produce an **editable draft in the same block-JSON model**, so everything downstream (editor, publish, render) is identical:

```
Tenant chooses a start strategy
  │
  ├─ (a) Starter template  → pick an industry/style template
  │                          → its prebuilt section layout loads as the DRAFT
  │
  ├─ (b) AI content gen     → short intake (business type, services, tone)
  │                          → AI service generates section copy + suggested
  │                            layout as the DRAFT; sections regenerate individually
  │
  └─ (c) Blank             → empty canvas; add sections from the block catalog

Optional prefill (any strategy, when data exists):
  FieldPie low-variance fields ──► business name, phone, address, hours
                                   → Contact block + LocalBusiness schema
```

After initialization the tenant works in the same **flexible builder**: drag-and-drop to reorder sections, add/remove blocks like widgets, swap photos, edit copy, and adjust colors and fonts via design tokens — then connect a domain and publish. Contact/request forms on the published site create **leads in FieldPie** where the tenant is connected (and can create internal leads otherwise). The AI content-generation service ships as **Phase 1.5** (Section 6); Phase 1 delivers templates + blank + the full flexible builder.

---

## 3. Database Schema and Tenant Isolation

Postgres is the primary store. Content lives as structured JSON in `blocks`/`pages`. Below is the indicative schema; field lists are representative, not final, and will be refined during Phase 1 step 1.

### 3.1 Core tables

**`tenants`** — one row per builder customer. Not necessarily tied to a FieldPie account.
`id (uuid, pk)`, `fieldpie_account_id` (**nullable** — link to FieldPie when connected), `name`, `status`, `created_at`, `updated_at`.

**`templates`** — reusable starter layouts for the "pick a template" init path.
`id (pk)`, `name`, `industry`, `thumbnail_url`, `blocks (jsonb)` (starter section tree), `is_system (bool)`, `created_at`. System templates are shared; a tenant's own saved layouts can extend this later.

**`sites`** — one site per tenant (allow >1 later).
`id (pk)`, `tenant_id (fk → tenants)`, `name`, `default_locale`, `theme_tokens (jsonb)` (brand colors/fonts/logo), `seo_defaults (jsonb)`, `created_at`, `updated_at`.

**`pages`** — pages within a site.
`id (pk)`, `tenant_id (fk)`, `site_id (fk → sites)`, `path` (e.g. `/`, `/services`), `title`, `seo (jsonb)`, `draft_blocks_id (fk → blocks)`, `published_blocks_id (fk → blocks, nullable)`, `status`, `created_at`, `updated_at`. Unique on `(site_id, path)`.

**`blocks`** — the Puck JSON tree for a page, versioned. This is the content payload.
`id (pk)`, `tenant_id (fk)`, `page_id (fk → pages)`, `content (jsonb)` (Puck component tree), `kind` (`draft` | `published`), `version (int)`, `created_at`. A page points at its current draft and its current published blocks rows.

**`domains`** — hostname → tenant/site mapping; drives middleware resolution.
`id (pk)`, `tenant_id (fk)`, `site_id (fk)`, `hostname` (unique), `type` (`subdomain` | `custom`), `verification_status` (`pending` | `verifying` | `active` | `failed`), `cloudflare_hostname_id` (nullable), `ssl_status`, `is_primary (bool)`, `created_at`, `updated_at`.

**`media_assets`** — references to objects in S3-compatible storage.
`id (pk)`, `tenant_id (fk)`, `site_id (fk)`, `storage_key`, `url`, `alt_text`, `width`, `height`, `mime_type`, `source` (`fieldpie` | `upload`), `created_at`.

**`publish_states`** — audit/version log of publish events (enables rollback later).
`id (pk)`, `tenant_id (fk)`, `site_id (fk)`, `page_id (fk)`, `published_blocks_id (fk → blocks)`, `published_by`, `published_at`, `note`.

### 3.2 Relationships (summary)

`tenants 1─* sites 1─* pages 1─* blocks`; `sites 1─* domains`; `sites 1─* media_assets`; `pages 1─* publish_states`. **Every** content table carries `tenant_id` directly (denormalized on purpose) so isolation never depends on a join being correct.

### 3.3 Tenant isolation strategy (security requirement)

Isolation is enforced at three layers, defense-in-depth:

1. **Data-access layer (primary control).** All tenant data goes through a single `TenantScopedDb` wrapper that is constructed with a `tenant_id` and **injects `WHERE tenant_id = $current` into every read and write**. Application code cannot query content tables directly; it must go through this wrapper. Drizzle's SQL-first model makes this wrapper simple and auditable. Any query that would touch a tenant table without a tenant scope is a lint/review failure.

2. **Request context.** Middleware resolves the tenant once (Section 2.1) and establishes an immutable tenant context for the request. For admin/editor routes, the tenant is derived from the FieldPie-authenticated session, and cross-tenant access is rejected.

3. **Database RLS (optional hardening, later).** Because we're on plain Postgres (Neon), we can add Row-Level Security policies keyed on a session variable as a backstop, so even a mistaken raw query cannot cross tenants. Recommended for Phase 3 hardening, not required for Phase 1.

Additional rules: `tenant_id` and personal data never appear in URL params; user-authored content is sanitized before storage and again defensively at render; media access is tenant-scoped.

---

## 4. Custom Domains and SSL (Cloudflare for SaaS)

Two cases: the free **wildcard subdomain**, and the **BYO custom domain**.

### 4.1 Free subdomain: `*.fieldpie.site` (wildcard)

We provision a **wildcard DNS record** (`*.fieldpie.site`) and a **wildcard TLS certificate** covering all subdomains. When a tenant is created, we insert a `domains` row (`type = subdomain`, e.g. `acme.fieldpie.site`, `verification_status = active` immediately — no per-tenant DNS or cert work). Middleware resolves `acme.fieldpie.site → tenant` via the `domains` table. This is zero-friction and available the moment a tenant onboards.

### 4.2 BYO custom domain: Cloudflare for SaaS (custom hostnames)

Flow when a tenant connects `acme-plumbing.com`:

```
1. Tenant enters custom domain in the builder.
2. We call Cloudflare for SaaS "custom hostname" API → creates a custom hostname
   under our zone; store `cloudflare_hostname_id`, set verification_status = pending.
3. We show the tenant the DNS records to add at their registrar:
     - a CNAME (their domain → our Cloudflare SaaS fallback/target), and
     - a domain-control-validation (DCV) record for certificate issuance.
4. Tenant adds the records at their DNS provider.
5. Cloudflare validates ownership (DCV) and issues/renews an SSL cert automatically.
6. We poll / receive status → when hostname active + cert active,
   set verification_status = active, ssl_status = active.
7. Middleware now resolves acme-plumbing.com → tenant; CDN serves the site over HTTPS.
8. Certificate renewal is automatic (Cloudflare-managed) — no tenant action.
```

Cloudflare for SaaS is purpose-built for exactly this: thousands of customer-owned hostnames terminating TLS under our infrastructure, with automated issuance and renewal.

### 4.3 Verification UX

The builder shows a **domain status panel** per custom domain: the exact DNS records to add (with copy buttons), a live status badge (`Pending → Verifying → Active`, or `Failed` with the reason), a "Re-check" button that polls Cloudflare, and clear help text for common registrar mistakes (wrong record type, propagation delay, proxy conflicts). Subdomains show as `Active` immediately with no setup. SSL status is surfaced alongside domain status so tenants see when HTTPS is live.

---

## 5. Repository / Folder Structure and Module Boundaries

A single Next.js repo with feature-based module boundaries. Indicative layout (App Router, TypeScript):

```
fieldpie-website-builder/
├─ app/
│  ├─ (public)/                 # public tenant site rendering (SSR/SSG)
│  │  └─ [[...path]]/           # catch-all: tenant resolved via middleware
│  ├─ (admin)/                  # authenticated builder/editor UI (auth adapter)
│  │  ├─ start/                 # new-site init: template / AI / blank chooser
│  │  ├─ editor/                # Puck editor surface (drag-drop, add/remove sections)
│  │  ├─ domains/               # custom domain + verification UX
│  │  └─ settings/              # branding/theme (colors, fonts), SEO defaults
│  ├─ api/                      # route handlers (publish, forms→leads, domain APIs)
│  ├─ sitemap.xml/route.ts      # per-tenant sitemap
│  └─ robots.txt/route.ts
├─ middleware.ts                # hostname → tenant resolution
├─ src/
│  ├─ blocks/                   # Puck block catalog (hero, services, reviews, gallery, contact)
│  │                           #   each block = one React component used in editor AND runtime
│  ├─ editor/                   # Puck config, block registration, editor glue
│  ├─ rendering/                # JSON tree → HTML, theme-token → CSS-var resolution
│  ├─ tenancy/                  # tenant context, hostname resolver, TenantScopedDb wrapper
│  ├─ db/                       # Drizzle schema, migrations, query modules
│  ├─ domains/                  # Cloudflare-for-SaaS client, verification state machine
│  ├─ site-init/                # init strategies: template loader, prefill, blank
│  ├─ templates/                # starter template catalog + thumbnails
│  ├─ ai/                       # AI content generation (Phase 1.5): prompts, guardrails
│  ├─ auth/                     # auth adapter (FieldPie session + room for own signup)
│  ├─ fieldpie/                 # FieldPie API adapter (optional prefill + lead creation)
│  ├─ seo/                      # title/meta/OG/JSON-LD/sitemap scaffolding
│  ├─ media/                    # S3-compatible storage client, image handling
│  ├─ publish/                  # draft→published promotion, revalidate + cache purge
│  ├─ security/                 # sanitization (DOMPurify config), input validation
│  └─ shared/                   # types, utils, design tokens
├─ tests/                       # tenant resolution, publish flow, domain verification
└─ README.md                    # what it does + how to run/test (American English)
```

**Module boundaries (the important ones):**

`tenancy` is the only module that establishes tenant context and owns `TenantScopedDb`; everything else receives a tenant-scoped db, never a raw one. `blocks` is shared between `editor` and `rendering` — one component definition, two consumers. `auth` is an **adapter** so we can support FieldPie session integration now and leave room for an own-signup flow without committing to either. `fieldpie` is an **adapter** isolating us from FieldPie's internal data model (Section 7 open question), used for optional prefill and lead creation, so changes on their side touch one module. `site-init` orchestrates the three start strategies but writes the same block-JSON as everything else. `ai` (Phase 1.5) is isolated behind its own module so the LLM provider and prompt logic can evolve independently. `domains` owns the Cloudflare integration and the verification state machine. `publish` is the only writer of published state and the only trigger of revalidation/cache purge. `security` centralizes sanitization so there is exactly one place to audit.

---

## 6. Phase 1 (MVP) — Ordered, Approvable Work Items

Scope: **subdomain-only** sites, a **flexible builder** (drag-and-drop reordering, add/remove sections, color/font control), a small block set, site initialization via **template or blank** (AI is Phase 1.5), and a request form that creates a lead. Custom domains (Cloudflare) are **Phase 2** and excluded here. Each item is sized to be planned, approved, and implemented as its own step under our plan-first gate.

**Phase 1 (MVP):**

1. **Project scaffold + standards.** Next.js App Router + TS strict, Tailwind + design-token layer, lint/format, CI, README skeleton. No product logic yet.
2. **Database schema + Drizzle setup.** Implement `tenants, templates, sites, pages, blocks, domains, media_assets, publish_states`; drizzle-kit migrations; connect Neon. Finalize field lists from Section 3.
3. **Tenant context + `TenantScopedDb`.** The isolation wrapper and request-scoped tenant context, with tests proving cross-tenant reads/writes are impossible.
4. **Hostname → tenant middleware (subdomain case).** Resolve `*.fieldpie.site` → tenant/site; 404 unknown hosts; wildcard subdomain + wildcard cert provisioning documented and configured.
5. **Block catalog v1 + theming.** Hero, Services, Reviews, Gallery, Contact as typed React components usable in both editor and runtime, themed via CSS variables (per-tenant colors/fonts).
6. **Public render path (SSR/SSG).** Render published page JSON → HTML for a tenant/path, with SEO scaffolding (title, meta, OG, LocalBusiness JSON-LD, sitemap.xml, robots.txt) and CDN caching.
7. **Flexible Puck editor (draft).** Register the block catalog in Puck; **drag-and-drop reordering, add/remove sections, color/font controls**; load/save **draft** JSON per tenant; autosave; strict draft/published separation.
8. **Publish flow.** Atomic draft→published promotion, versioned in `publish_states`; on-demand revalidation + CDN cache purge; live site reflects only published state.
9. **Site initialization (template + blank) + start chooser.** New-site flow that lets the tenant pick a starter template or start blank, both producing an editable draft; optional FieldPie prefill of contact fields where connected.
10. **Request form → lead.** Contact/request block submits, is sanitized/validated, and creates a lead (via the FieldPie adapter when connected; internal lead otherwise).
11. **Auth abstraction + tenant provisioning.** An auth adapter supporting FieldPie session integration with room for an own-signup flow, without committing to either; tenant provisioned independently of a FieldPie account (`fieldpie_account_id` optional); reject cross-tenant access.
12. **MVP hardening + tests + README.** Critical-path tests (tenant resolution, publish, init, lead creation), accessibility (WCAG AA) and mobile-first checks, performance budget pass (LCP, image optimization), and the American-English run/test notes.

**Phase 1.5 — AI content generation.** An AI service that generates section copy and a suggested layout from a short intake (business type, services, tone), with **per-section regenerate**. New `src/ai` module: LLM provider integration, prompt design, cost controls, and content guardrails/sanitization. Delivered right after the flexible builder so AI writes into a proven block model.

Suggested dependency order: 1 → 2 → 3 → 4, then 5 → 6, then 7 → 8, then 9/10/11 in parallel-ish, then 12, then Phase 1.5. We will still gate each item individually.

---

## 7. Open Questions, Assumptions, and What I Need From You

**Resolved in v1.1 (decisions locked):** site initialization is **template / AI / blank, tenant's choice**; the builder is fully flexible (drag-and-drop, add/remove sections, color/font control); **AI content generation is Phase 1.5**; auth is **abstracted** and the tenant is **decoupled from a FieldPie account** (`fieldpie_account_id` optional), so the builder can later open to non-FieldPie users without a rewrite.

**Assumptions I'm making (correct me if wrong):**

- FieldPie can, *when a tenant is connected*, expose an internal API to **create a lead** and to read **low-variance contact fields** (business name, phone, address, hours) for optional prefill. Full service/area/review seeding is **no longer assumed**.
- FieldPie has an existing auth/session system we can integrate with via the auth adapter — while we keep room for our own signup flow later.
- We control the `fieldpie.site` domain (or can acquire it) and can set up a wildcard DNS record + wildcard TLS cert.
- We have (or will procure) a Cloudflare account eligible for **Cloudflare for SaaS**, and an **S3-compatible** object store for media.
- One site per tenant for Phase 1 (schema already allows more later).

**Open questions I need answered to proceed past planning:**

1. **FieldPie prefill + lead API.** For a *connected* tenant, what fields can we read for prefill, and what is the API/shape/auth to **create a lead**? (Shapes items 9–10 and the `fieldpie` adapter. No longer blocking for the core builder, since seeding is optional.)
2. **Auth details.** How does FieldPie auth work (session cookie, JWT, SSO/OAuth) so we can build the adapter? We're not committing to FieldPie-only vs. open signup yet, but the adapter needs the FieldPie side specified. (item 11)
3. **AI provider & budget (Phase 1.5).** Preferred LLM provider/model, and a per-generation cost ceiling? Any content/compliance constraints on AI-authored copy?
4. **Domain & infra ownership.** Is `fieldpie.site` (or the chosen builder domain) already owned? Do we have the Cloudflare (for SaaS) and S3-compatible storage accounts, or should I include procurement steps?
5. **Templates & theming freedom.** How many starter templates for MVP, which industries, and how much theming freedom do tenants get (fixed palettes vs. free color/font choice)? Any FieldPie brand kit to align with?
6. **Scale & cost targets.** Expected number of tenants/custom domains in year one? Informs when the self-host path in Section 1.5 becomes relevant.
7. **Compliance/data residency.** Any requirements (e.g., regional data residency, PII handling for leads) that affect DB host region and storage choices?

---

## 8. Decision Gate — What I Need You to Approve

**Stack decisions — APPROVED (v1.1):**

1. **Editor:** **Puck** ✅ — *approved.* (The flexible drag-and-drop / add-remove-section vision reinforces this choice.)
2. **Postgres host:** **Neon** ✅ — *approved.*
3. **ORM:** **Drizzle** ✅ — *approved.*
4. **Hosting:** **Vercel now + documented self-host path** ✅ — *approved.*

**Direction decisions — CONFIRMED (v1.1):**

- Site initialization: **template / AI / blank, tenant's choice** ✅
- AI content generation: **Phase 1.5** (after the flexible builder) ✅
- Auth: **abstracted adapter; tenant decoupled from FieldPie account** ✅

**Remaining scope & approach to confirm:**

5. **Phase 1 scope** as revised in Section 6 (subdomain-only, flexible builder, template + blank init, form→lead; AI in Phase 1.5; custom domains in Phase 2). Approve / adjust?
6. **Tenant isolation strategy** in Section 3.3 (app-layer `TenantScopedDb` as primary control; RLS as later hardening). Approve?
7. **Database schema** in Section 3 (now including `templates`, `fieldpie_account_id` optional) as the working baseline to refine in Phase 1 item 2. Approve?
8. **Proceed order** in Section 6 (one approved step at a time, starting with item 1: project scaffold). Approve starting point?

**Inputs that help but no longer block the core build (Section 7):** FieldPie prefill/lead API (Q1), auth details (Q2), AI provider/budget for Phase 1.5 (Q3), domain/infra ownership (Q4), and templates/theming scope (Q5).

Once you confirm items 5–8, I will write the **detailed step plan for Phase 1 item 1 (project scaffold)** and stop again for your approval — per our plan-first workflow. No implementation will begin before that.
