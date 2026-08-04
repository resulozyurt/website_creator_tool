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

## Locked decisions

**Stack (approved):**

- Framework: **Next.js (App Router) + React + TypeScript strict**
- Editor: **Puck** (block-based, portable JSON)
- Database: **Neon** (serverless Postgres) + **Drizzle** ORM
- Custom domains & SSL: **Cloudflare for SaaS**
- Hosting: **Vercel** now, documented self-host path later
- Styling: **Tailwind CSS** + per-tenant **design-token** layer (CSS variables)
- Media: **S3-compatible** object storage

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
- [ ] **Step 2 — Database schema + Drizzle setup**
  - [ ] Drizzle config + Neon connection (pooled + unpooled)
  - [ ] Tables: `tenants, templates, sites, pages, blocks, domains, media_assets, publish_states`
  - [ ] `fieldpie_account_id` nullable; `tenant_id` on every content table
  - [ ] First migration; finalize field lists
- [ ] **Step 3 — Tenant context + `TenantScopedDb`**
  - [ ] Request-scoped tenant context
  - [ ] `TenantScopedDb` wrapper injecting `tenant_id` on every read/write
  - [ ] Tests proving cross-tenant access is impossible
- [ ] **Step 4 — Hostname → tenant middleware (subdomain case)**
  - [ ] Resolve `*.fieldpie.site` → tenant/site; 404 unknown hosts
  - [ ] Wildcard subdomain + wildcard cert configuration documented
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
