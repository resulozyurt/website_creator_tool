# Subdomain routing, wildcard DNS, and TLS

_Step 4 — hostname → tenant resolution (subdomain case)._

This document explains how a visitor request to a tenant subdomain
(`acme.fieldpie.site`) is turned into a rendered tenant site, and the infrastructure
(DNS + TLS) that has to exist for it to work. Custom bring-your-own domains are Phase 2 and
are only stubbed here.

## Request flow

```
Visitor → acme.fieldpie.site/services
        │
        ▼
Edge middleware (middleware.ts)            ← no database access (node-postgres can't run on edge)
  parseHost("acme.fieldpie.site")          ← src/tenancy/hostname.ts (pure, edge-safe)
    → { kind: "subdomain", subdomain: "acme", hostname: "acme.fieldpie.site" }
  rewrite → /sites/acme.fieldpie.site/services
        │
        ▼
Node route (app/sites/[host]/[[...path]]/page.tsx)
  resolveTenantByHostname("acme.fieldpie.site")   ← src/tenancy/tenant-resolver.ts (queries `domains`)
    → { tenantId, siteId, ... }  or  null → 404
        │
        ▼
Render published page (Step 6)
```

Two-stage resolution is deliberate. The hostname _parse_ is a pure function that runs on the
Edge runtime inside middleware; the hostname _database lookup_ runs in the Node runtime inside
the route, because our Postgres driver (`node-postgres`) is not edge-compatible. Middleware
never touches the database.

### Why the host is carried in the path, not a header

Middleware rewrites to `/sites/<hostname>/<path>` instead of stashing the host in a request
header. Reading request headers in a Server Component opts the route into dynamic rendering,
which would defeat the static-generation / CDN strategy that Steps 6 and 8 depend on. Keeping
the host in the route params lets those steps use `generateStaticParams` and ISR later without
changing the resolution contract.

The `/sites/*` path space is **internal**. Only middleware rewrites should reach it; a direct
external request to `/sites/...` on the app domain is rejected with a 404.

### Reserved subdomains

Labels in `RESERVED_SUBDOMAINS` (`src/tenancy/hostname.ts`) — `www`, `app`, `api`, `admin`,
`auth`, `assets`, `static`, `cdn`, `media`, `mail`, `status` — belong to the platform and are
routed to the app, never to a tenant. Keep this set in sync with any real platform subdomain
you provision. Tenant subdomains must be validated against this set at signup so no tenant can
claim one.

### Local development

`parseHost` understands `*.localhost`, so you can exercise subdomain routing without DNS:

```
http://acme.localhost:3000/        → subdomain "acme"
http://localhost:3000/             → root (the app)
```

Most browsers resolve `*.localhost` to `127.0.0.1` automatically. Set
`NEXT_PUBLIC_ROOT_DOMAIN=fieldpie.site` in `.env.local` (already present).

## DNS: wildcard subdomain

Point a wildcard record at the platform so every tenant subdomain resolves to the same app:

| Type    | Name             | Value                          | Notes                                  |
| ------- | ---------------- | ------------------------------ | -------------------------------------- |
| `CNAME` | `*.fieldpie.site`| `<app-host>` (Railway/CF edge) | Wildcard for all free tenant sites.    |
| `CNAME` | `www`            | `<app-host>`                   | Marketing/app alias → routed as root.  |
| `A/AAAA`| `fieldpie.site`  | apex target (or CF proxied)    | Apex needs A/ALIAS depending on host.  |

A single wildcard record means provisioning a new tenant requires **no DNS change** — creating
the tenant's `domains` row (`type = 'subdomain'`, `hostname = '<label>.fieldpie.site'`) is
enough for `resolveTenantByHostname` to route it.

## TLS: wildcard certificate

Every `*.fieldpie.site` host must be served over HTTPS with a certificate that covers the
wildcard. Options, in order of preference for this stack:

1. **Cloudflare in front of the app (recommended).** Proxy `*.fieldpie.site` through
   Cloudflare; its edge presents a wildcard certificate for the zone automatically and renews
   it. This also gives us the CDN layer that published sites need (Step 6/8), and is the same
   Cloudflare account we'll use for **Cloudflare for SaaS** custom hostnames in Phase 2. Note
   that Cloudflare's default (Universal) certificate covers `fieldpie.site` and one level of
   wildcard `*.fieldpie.site`, but **not** deeper labels like `a.b.fieldpie.site` — which is
   exactly why `parseHost` treats multi-level labels as invalid.
2. **Railway wildcard custom domain.** Add `*.fieldpie.site` as a wildcard custom domain on the
   Railway service; Railway issues and renews the wildcard certificate. Use this if we choose
   not to front the app with Cloudflare early on.

Whichever terminates TLS forwards the original `Host` header to the app, which is what
middleware reads. Do not let the proxy rewrite `Host` to an internal name, or tenant resolution
will break.

## Phase 2 preview: custom domains

`parseHost` already classifies an unrelated domain as `kind: "custom"` and the middleware
rewrites it into the same `/sites/<hostname>/...` path, so `resolveTenantByHostname` will route
it the moment a matching `domains` row exists with `verification_status = 'active'`. Issuing and
renewing per-hostname certificates for those domains is handled by **Cloudflare for SaaS**
(custom hostnames API) in Phase 2 — no code change to the resolution path is required.
