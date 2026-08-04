import { NextResponse, type NextRequest } from "next/server";
import { parseHost } from "@/tenancy/hostname";

/**
 * Multi-tenant hostname routing (Step 4 — subdomain case).
 *
 * Runs on every non-asset request in the Edge runtime and does NO database work — the
 * `node-postgres` driver cannot run on the edge. It only inspects the `Host` header and
 * decides where the request goes:
 *
 *   - root domain / www / reserved label / localhost → serve the app as-is.
 *   - `<tenant>.fieldpie.site` (or a custom domain)   → internally rewrite to
 *     `/sites/<hostname>/<path>`, where a Node-runtime route resolves the tenant against the
 *     database and renders (or 404s) the site.
 *   - malformed host                                  → 404.
 *
 * The `/sites/*` namespace is internal. Only these rewrites should reach it; a direct request
 * to `/sites/...` on the root domain is rejected so the internal path is not publicly
 * addressable. Because Next.js does not re-run middleware on an internal rewrite, this guard
 * only ever sees genuine external probes.
 *
 * IMPORTANT: this file imports the PURE host parser (`@/tenancy/hostname`), never the
 * `@/tenancy` barrel, which would drag the db client into the edge bundle.
 */

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "fieldpie.site";
const SITES_PREFIX = "/sites";

function notFound(): NextResponse {
  return new NextResponse("Not Found", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export function middleware(request: NextRequest): NextResponse {
  const hostHeader = request.headers.get("host") ?? request.nextUrl.host;
  const routing = parseHost(hostHeader, ROOT_DOMAIN);
  const { pathname } = request.nextUrl;
  const isInternalPath = pathname === SITES_PREFIX || pathname.startsWith(`${SITES_PREFIX}/`);

  switch (routing.kind) {
    case "root":
      // Block external probes of the internal namespace on the app domain.
      return isInternalPath ? notFound() : NextResponse.next();

    case "subdomain":
    case "custom": {
      // Rewrite `<host>/<path>` → `/sites/<host>/<path>` (path preserved; root maps to bare).
      const url = request.nextUrl.clone();
      const suffix = pathname === "/" ? "" : pathname;
      url.pathname = `${SITES_PREFIX}/${routing.hostname}${suffix}`;
      return NextResponse.rewrite(url);
    }

    case "invalid":
    default:
      return notFound();
  }
}

export const config = {
  // Run on everything except Next internals and obvious static files. Per-tenant routes such
  // as sitemap.xml and robots.txt are added in Step 6 and are intentionally NOT excluded here.
  matcher: ["/((?!api/|_next/static/|_next/image/|favicon.ico).*)"],
};
