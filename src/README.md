# Source modules

Feature-based module boundaries. Public tenant pages are always server/statically
rendered. Every tenant-scoped query must go through the tenant-scoped data-access
layer in `tenancy`.

| Module      | Responsibility                                                             |
| ----------- | -------------------------------------------------------------------------- |
| `blocks`    | Puck block catalog (hero, services, reviews, gallery, contact).            |
| `editor`    | Puck configuration and block registration for the admin builder.           |
| `rendering` | Render a block-JSON tree to HTML; resolve design tokens to CSS variables.  |
| `tenancy`   | Tenant context, hostname resolution, and the `TenantScopedDb` wrapper.     |
| `db`        | Drizzle schema, migrations, and query modules.                             |
| `domains`   | Cloudflare for SaaS client and the domain-verification state machine.      |
| `site-init` | New-site initialization strategies: template, blank, and optional prefill. |
| `templates` | Starter template catalog and thumbnails.                                   |
| `ai`        | AI content generation (Phase 1.5): prompts, guardrails, provider client.   |
| `auth`      | Auth adapter: FieldPie session integration with room for own signup.       |
| `fieldpie`  | FieldPie API adapter: optional prefill and lead creation.                  |
| `seo`       | Title, meta, Open Graph, JSON-LD, sitemap, and robots scaffolding.         |
| `media`     | S3-compatible storage client and image handling.                           |
| `publish`   | Draft-to-published promotion, revalidation, and CDN purge.                 |
| `security`  | Input sanitization (DOMPurify) and validation.                             |
| `shared`    | Cross-cutting types, utilities, and design tokens.                         |
