# FieldPie Website Builder — Development Log

**Purpose of this file.** This is the single source of truth for project state. It carries
context across sessions: the locked decisions, the ordered step plan, what is done, what is
next, and how to resume in a brand-new chat. **Update it after every development step**, then
commit it alongside the code.

- Full architecture: [`PROJECT_PLAN.md`](./PROJECT_PLAN.md) (readable: `PROJECT_PLAN_EN.html`, `PROJECT_PLAN_TR.html`)
- Repository: https://github.com/resulozyurt/website_creator_tool
- Language rule: chat with the user in Turkish; **all code, comments, docs, and commits in American English**.

---

## How to resume in a new chat

1. Read this file top to bottom. It reflects the latest state.
2. Read `PROJECT_PLAN.md` for the architecture and rationale behind any step.
3. Find the first unchecked item under **Step plan** — that is the next step.
4. Confirm the step with the user, implement it, then:
   - update the checkbox and the **Progress log**,
   - add a row to **Commit history**,
   - commit with an American-English message and push.
5. Never write implementation ahead of the current step without the user's go-ahead.

---

## Manual setup checklist (things only the user can do)

The assistant writes all code. These are the external accounts / commands only the user can
perform. Check them off as you go.

**One-time, now:**

- [ ] **Push to GitHub** — run the "First push" block under *Git workflow* once.
- [ ] **Install dependencies** — `npm install` in the project folder.

**Step 2 (database) — needed before anything runs against the DB:**

- [x] `.env.local` created; S3 storage + AI-gateway creds placed (from `neon-storage.env`):
      `AWS_ENDPOINT_URL_S3`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
      `OPENAI_API_KEY`. Neon is kept **only** for object storage + AI gateway.
- [ ] **In Railway:** add a **Postgres** service to your project.
- [ ] Copy its **`DATABASE_URL`** (public URL for local use) into `.env.local`.
- [ ] Confirm the Neon object-storage **bucket name** and set `S3_BUCKET`.
- [ ] Run `npm install`, then `npm run db:generate` and `npm run db:migrate` to create the tables.

**Later (the assistant will flag each when its step arrives):**

- Railway app deployment (connect the GitHub repo; set env vars) and a Cloudflare for SaaS
  account (Phase 2 custom domains; also fronts the app for CDN).
- FieldPie API access (optional prefill + lead creation).
- Already provided: S3-compatible storage (Neon Object Storage) and an AI-gateway key.

---

## Locked decisions

**Stack (approved):**

- Framework: **Next.js (App Router) + React + TypeScript strict**
- Editor: **Puck** (block-based, portable JSON)
- Database: **Railway Postgres** + **Drizzle** ORM (via the `node-postgres` driver)
- Hosting: **Railway** (Next.js as a Node service). Cloudflare fronts published sites for CDN.
- Custom domains & SSL: **Cloudflare for SaaS** (wildcard `*.fieldpie.site` + BYO domains)
- Styling: **Tailwind CSS** + per-tenant **design-token** layer (CSS variables)
- Media: **S3-compatible** object storage — **Neon Object Storage** (retained)
- AI (Phase 1.5): **Neon AI Gateway** (retained)

> **Change history:** Originally Vercel + Neon Postgres. Switched to **Railway (host +
> Postgres)** on 2026-08-04 at the user's request (existing Railway account, more familiar).
> Neon is kept only for object storage + AI gateway. DB driver changed from
> `@neondatabase/serverless` to `node-postgres`. The `PROJECT_PLAN*` documents still describe
> the original Vercel/Neon choice in places; **this section is authoritative.**

**Direction (confirmed):**

- Site initialization is the tenant's choice: **starter template / AI / blank** — all write the same block-JSON.
- Content is **not** auto-generated from FieldPie data (offerings vary too much). FieldPie is an **optional prefill** of low-variance fields only.
- **AI content generation is Phase 1.5** (after the flexible builder).
- The builder is **flexible**: drag-and-drop reordering, add/remove sections, color/font control.
- Auth is **abstracted**; the tenant is **decoupled from a FieldPie account** (`fieldpie_account_id` optional), so the builder can open to non-FieldPie users later without a rewrite.

**Scaffold conventions (set in Step 1):**

- Package manager: **npm**. Node 20+ (developed on Node 22).
- Path alias: `@/*` → `src/*`.
- Pinned major versions: Next 15, React 19, TypeScript 5.6, Tailwind 3.4, ESLint 8 (classic config). Adjust via `npm install` as needed.

---

## Step plan (Phase 1 MVP, then Phase 1.5)

Each step is implemented, logged, and committed on its own. Sub-items are the concrete work.

- [x] **Step 1 — Project scaffold + standards**
  - [x] Next.js App Router + TypeScript strict (`tsconfig` strict flags, `@/*` alias)
  - [x] Tailwind + design-token layer (`tailwind.config.ts`, `app/globals.css` CSS variables)
  - [x] ESLint (`no-explicit-any` error) + Prettier
  - [x] `.gitignore`, `.env.example`, README, `src/README.md` module map
  - [x] Feature-module folder structure under `src/`
  - [x] CI workflow (install, lint, typecheck, build)
- [x] **Step 2 — Database schema + Drizzle setup**
  - [x] Drizzle config + Neon connection (pooled runtime client + unpooled for migrations)
  - [x] Tables: `tenants, templates, sites, pages, blocks, domains, media_assets, publish_states`
  - [x] `fieldpie_account_id` nullable; `tenant_id` on every content table; enums; indexes
  - [x] First migration generated (`drizzle/0000_wealthy_killmonger.sql`) and **applied to Railway Postgres** (`npm run db:migrate` succeeded).
- [x] **Step 3 — Tenant context + `TenantScopedDb`**
  - [x] Request-scoped `TenantContext` (`src/tenancy/context.ts`, immutable/frozen)
  - [x] `forTenant(tenantId)` wrapper: filters every read/update/delete by `tenant_id`, forces `tenant_id` on insert; per-table repos (sites, pages, blocks, domains, media_assets, publish_states, + tenant self). `templates` excluded (global).
  - [x] Isolation tests (`tests/tenancy/...`) proving the tenant filter is always present, via `.toSQL()` (offline). Vitest configured. **Run `npm test` locally — not run in the tool sandbox.**
- [x] **Step 4 — Hostname → tenant middleware (subdomain case)**
  - [x] Resolve `*.fieldpie.site` → tenant/site; 404 unknown hosts (pure edge parser + Node-runtime DB resolver + rewrite to `/sites/[host]`)
  - [x] Wildcard subdomain + wildcard cert configuration documented (`docs/subdomain-routing.md`)
- [ ] **Step 5 — Block catalog v1 + theming**
  - [ ] Hero, Services, Reviews, Gallery, Contact as typed React components
  - [ ] Usable in both editor and runtime; themed via CSS variables
- [ ] **Step 6 — Public render path (SSR/SSG)**
  - [ ] Render published page JSON → HTML for (tenant, path)
  - [ ] SEO scaffolding: title, meta, OG, LocalBusiness JSON-LD, sitemap.xml, robots.txt
  - [ ] CDN caching
- [ ] **Step 7 — Flexible Puck editor (draft)**
  - [ ] Register block catalog; drag-and-drop reorder, add/remove sections, color/font controls
  - [ ] Load/save draft JSON per tenant; autosave; strict draft/published separation
- [ ] **Step 8 — Publish flow**
  - [ ] Atomic draft→published promotion, versioned in `publish_states`
  - [ ] On-demand revalidation + CDN purge
- [ ] **Step 9 — Site initialization (template + blank) + start chooser**
  - [ ] Template picker and blank start, both producing an editable draft
  - [ ] Optional FieldPie prefill of contact fields where connected
- [ ] **Step 10 — Request form → lead**
  - [ ] Contact block submits; sanitize/validate
  - [ ] Create a lead via FieldPie adapter when connected; internal lead otherwise
- [ ] **Step 11 — Auth abstraction + tenant provisioning**
  - [ ] Auth adapter (FieldPie session + room for own signup)
  - [ ] Tenant provisioned independently of a FieldPie account; reject cross-tenant access
- [ ] **Step 12 — MVP hardening + tests + README**
  - [ ] Critical-path tests (tenant resolution, publish, init, lead)
  - [ ] WCAG AA + mobile-first checks; performance budget (LCP, images)
  - [ ] Run/test notes finalized
- [ ] **Phase 1.5 — AI content generation**
  - [ ] `src/ai` module: LLM provider, prompts, cost controls, guardrails/sanitization
  - [ ] Generate section copy + suggested layout from a short intake; per-section regenerate

**Deferred to later phases:** custom domains + SSL (Phase 2), Google Business Profile & booking (Phase 3), more templates / blog / A/B / analytics / self-host (Phase 4).

---

## Progress log

Newest entries at the top.

### 2026-08-04 — Step 4 complete: hostname → tenant middleware (subdomain case)
Two-stage tenant resolution. The hostname *parse* is a pure, edge-safe function
(`src/tenancy/hostname.ts`, `parseHost` → `root | subdomain | custom | invalid`; handles the
apex/www, reserved subdomains, port stripping, case-folding, nested-label rejection, and
`*.localhost` for local dev). The hostname *database lookup* is Node-runtime only
(`src/tenancy/tenant-resolver.ts`, `resolveTenantByHostname` querying the `domains` table —
subdomains always routable, custom domains require `verification_status='active'`). This split
exists because `node-postgres` cannot run on the Edge runtime where Next middleware executes.

`middleware.ts` (root) reads the `Host` header, and for a tenant host rewrites the request to
`/sites/<hostname>/<path>` (host carried in the path, **not** a header, so Step 6/8 static
generation isn't forced dynamic); unknown/malformed hosts get a 404, and the internal
`/sites/*` namespace is not externally addressable on the app domain.
`app/sites/[host]/[[...path]]/page.tsx` is a minimal placeholder that resolves the tenant and
`notFound()`s unknown hosts — the real renderer + SEO land in Step 6. Middleware imports the
pure parser directly (`@/tenancy/hostname`), never the `@/tenancy` barrel, to keep the db
client out of the edge bundle.

**Architectural note (non-blocking):** resolving hostname→tenant is a cross-tenant *bootstrap*
lookup (the tenant is unknown at that point), so `tenant-resolver` legitimately uses the raw db
client — one of the sanctioned exceptions alongside migrations, and it stays inside the tenancy
layer. Everything after a `tenantId` is known still goes through `forTenant`.

**Verified in the tool sandbox this time:** `npx tsc --noEmit` clean; `npx vitest run` → 28/28
passing (new: 15 hostname cases + 4 resolver SQL cases, both offline via `.toSQL()`). Note: the
mounted `node_modules` was installed on Windows, so the Linux `@rollup/rollup-linux-x64-gnu`
native binary had to be added in-sandbox to run Vitest; this does not touch `package.json` /
`package-lock.json`. `next lint` is slow to boot in the sandbox and is left to CI as before.
Next: Step 5 (block catalog v1 + theming).

### 2026-08-04 — Step 3 complete: tenant-scoped data-access layer
Added `src/tenancy/context.ts` (immutable `TenantContext`), `src/tenancy/tenant-scoped-db.ts`
(`forTenant(tenantId)` — per-table repos for sites/pages/blocks/domains/media_assets/
publish_states + the tenant's own row; every read/update/delete is filtered by `tenant_id`
and every insert forces it; `templates` excluded as global), and `src/tenancy/index.ts`.
Added `vitest.config.ts` (aliases `@`, dummy `DATABASE_URL`) and offline isolation tests in
`tests/tenancy/tenant-scoped-db.test.ts` that assert via `.toSQL()` that the tenant filter is
always present and inserts can't escape the scope. **Tests not run in the tool sandbox — run
`npm test` locally / in CI.** Also confirmed the first migration applied to Railway Postgres.
Next: Step 4 (hostname → tenant middleware).

### 2026-08-04 — Fix: drizzle-kit `url: ''` (real root cause)
`db:migrate` kept reporting `url: ''` even with `DATABASE_URL` set. Real cause: the config
used `DATABASE_URL_UNPOOLED ?? DATABASE_URL`, and `.env.local` defines
`DATABASE_URL_UNPOOLED=""` (empty but **defined**). `??` only skips null/undefined, so the
empty string won over the real `DATABASE_URL`. Fixed by using `||` with `.trim()` so empty
values fall through: `DATABASE_URL_UNPOOLED?.trim() || DATABASE_URL?.trim() || ""`.
(Also kept the `dotenv-cli` wrapper on `db:migrate`/`push`/`studio` so `.env.local` loads for
CLI runs; `dotenv-cli` was added to devDependencies. Note: a global `python-dotenv` can shadow
the `dotenv` command until `npm install` puts node's `dotenv-cli` in `node_modules/.bin`.)
Migration `drizzle/0000_wealthy_killmonger.sql` (8 tables) generated — commit the `drizzle/` folder.

### 2026-08-04 — Step 2 revision: switch to Railway (host + Postgres)
At the user's request (existing Railway account), moved hosting and Postgres to **Railway**.
Changed the DB driver from `@neondatabase/serverless` (neon-http) to **`node-postgres`**
(`pg` + `drizzle-orm/node-postgres`) in `src/db/client.ts`; updated `package.json` deps
(`pg`, `@types/pg`), `drizzle.config.ts`, and the DB sections of `.env.local` / `.env.example`.
The schema is unchanged. Neon is retained only for object storage + AI gateway. Runtime is now
all-Node (no edge), which suits `node-postgres` well.

### 2026-08-04 — Step 2: database schema + Drizzle/Neon
Added Drizzle ORM + Neon serverless deps and `db:*` scripts, `drizzle.config.ts` (migrations
via the unpooled connection), and `src/db/schema.ts` with all eight tables (`tenants`,
`templates`, `sites`, `pages`, `blocks`, `domains`, `media_assets`, `publish_states`), enums,
indexes, and inferred types. `tenant_id` is on every content table; `fieldpie_account_id` is
nullable. The raw client (`src/db/client.ts`) is marked internal — only the tenancy layer
(Step 3) and migration/seed scripts may use it.

**Design refinement (documented, non-blocking):** dropped the plan's `draft_blocks_id` /
`published_blocks_id` pointer columns on `pages` to avoid a circular FK with `blocks`.
Instead, a page has one `draft` blocks row (partial-unique on `page_id where kind='draft'`)
and versioned `published` rows; the live snapshot is the highest-version published row, also
logged in `publish_states`.

**Not run in the sandbox:** `npm run db:generate` (migration SQL) and `tsc`/build — deps
aren't installed here. CI verifies these on push; generate the first migration locally.

### 2026-08-04 — Step 1: project scaffold
Scaffolded the Next.js App Router project in TypeScript strict mode with the Tailwind
design-token layer, ESLint/Prettier, a CI workflow, and the feature-module folder structure
under `src/`. No product logic yet. Structurally verified: all JSON/ESM config files parse,
all files and module directories present.

**Git handoff.** The scaffold assistant runs in a sandbox that cannot delete files on the
mounted folder, so it cannot manage a `.git` lock cleanly and has no GitHub credentials to
push. The two commits below are therefore made and pushed **from the user's machine** using
the block in "Git workflow" (delete any partial `.git` first, then init/commit/push).

---

## Commit history

Newest at the top. Messages are American English, imperative mood.

| Date       | Commit message                                                                 |
| ---------- | ------------------------------------------------------------------------------ |
| 2026-08-04 | `feat(tenancy): resolve tenant by hostname via edge middleware and subdomain routing` |
| 2026-08-04 | `feat(tenancy): add tenant-scoped data-access layer with isolation tests`       |
| 2026-08-04 | `refactor(db): switch to Railway Postgres via node-postgres driver`             |
| 2026-08-04 | `feat(db): add Drizzle schema and Neon client for core tables`                 |
| 2026-08-04 | `chore: scaffold Next.js App Router app with TypeScript, Tailwind, ESLint, CI` |
| 2026-08-04 | `docs: add project plan and development log`                                    |

---

## Git workflow

The repository lives at https://github.com/resulozyurt/website_creator_tool.

**First push (run once, from the project root on your machine).** Remove any partial `.git`
created by the tool, then initialize and push:

```powershell
# PowerShell (Windows)
Remove-Item -Recurse -Force .git   # only needed the first time, to clear the partial repo
git init
git branch -M main
git config user.name "Resul Ozyurt"
git config user.email "rozyurt791@gmail.com"

git add PROJECT_PLAN.md PROJECT_PLAN_EN.html PROJECT_PLAN_TR.html DEVELOPMENT_LOG.md
git commit -m "docs: add project plan and development log"

git add -A
git commit -m "chore: scaffold Next.js App Router app with TypeScript, Tailwind, ESLint, CI"

git remote add origin https://github.com/resulozyurt/website_creator_tool.git
git push -u origin main
```

**Every step after that, from the project root:**

```bash
git add -A
git commit -m "<type>: <american-english summary>"   # e.g. feat:, chore:, docs:, test:
git push
```

Note: the assistant prepares each commit message and updates this log, but the actual
`git push` runs on your machine, where you are authenticated to GitHub.
