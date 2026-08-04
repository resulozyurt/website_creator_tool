# FieldPie Website Builder

A single-codebase, multi-tenant website builder for FieldPie customers (home & field
service businesses). One deployment serves thousands of tenant sites. Each tenant gets a
free subdomain (`customer.fieldpie.site`) and can optionally connect a custom domain with
automatic SSL. Site content is stored as structured JSON, edited in a flexible drag-and-drop
builder, and rendered server-side / statically for SEO and performance.

New sites are initialized the tenant's way — **pick a starter template, generate content
with AI, or start blank** — never auto-generated from FieldPie data (offerings vary too
much to seed reliably). Where FieldPie holds low-variance data (business name, phone,
address, hours), we can optionally prefill it.

> This repository is at **Step 1 (project scaffold)** of Phase 1. See
> [`DEVELOPMENT_LOG.md`](./DEVELOPMENT_LOG.md) for the full plan, current progress, and how
> to resume in a new session. The full architecture is in [`PROJECT_PLAN.md`](./PROJECT_PLAN.md)
> (readable versions: `PROJECT_PLAN_EN.html`, `PROJECT_PLAN_TR.html`).

## Tech stack

- **Framework:** Next.js (App Router) + React + TypeScript (strict).
- **Styling:** Tailwind CSS with a per-tenant design-token layer (CSS variables).
- **Editor:** Puck (block-based, exports portable JSON).
- **Database:** Neon (serverless Postgres) with Drizzle ORM.
- **Custom domains & SSL:** Cloudflare for SaaS.
- **Hosting:** Vercel (with a documented self-host migration path).
- **Media:** S3-compatible object storage.

## Requirements

- Node.js 20+ (developed on Node 22)
- npm 10+

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local   # then fill in real values

# 3. Run the dev server
npm run dev                  # http://localhost:3000
```

## Scripts

| Command                | What it does                                  |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Start the Next.js dev server.                 |
| `npm run build`        | Production build.                             |
| `npm run start`        | Serve the production build.                   |
| `npm run lint`         | Run ESLint (Next.js + TypeScript rules).      |
| `npm run typecheck`    | Type-check the project with `tsc --noEmit`.   |
| `npm run format`       | Format the codebase with Prettier.            |
| `npm run format:check` | Verify formatting without writing changes.    |

## Project structure

```
app/                     # Next.js App Router entry (layout, pages, route handlers)
src/                     # Feature modules (see src/README.md for the module map)
tests/                   # Tests for critical paths
.github/workflows/ci.yml # CI: install, lint, typecheck, build
```

Feature modules and their boundaries are documented in [`src/README.md`](./src/README.md).

## Conventions

- TypeScript strict mode; no `any` without written justification.
- Every tenant-scoped query goes through the tenant-scoped data-access layer (`src/tenancy`).
- Public tenant pages are always server/statically rendered — never client-only.
- All code, comments, and documentation are written in American English.
