import { notFound } from "next/navigation";
import { resolveTenantByHostname } from "@/tenancy/tenant-resolver";

/**
 * Public tenant site entry point (Node runtime).
 *
 * Middleware rewrites `<tenant-host>/<path>` to `/sites/<host>/<path>` so it lands here. This
 * is where the actual database lookup happens — the edge middleware cannot query Postgres.
 * We resolve the hostname to a tenant/site and 404 unknown hosts.
 *
 * This is a deliberately minimal placeholder for Step 4: it proves the resolution path
 * end to end. The real block-JSON renderer, SEO scaffolding, and static generation land in
 * Step 6 (Public render path). Until then this route is rendered dynamically.
 */

interface TenantSitePageProps {
  params: Promise<{ host: string; path?: string[] }>;
}

export default async function TenantSitePage({ params }: TenantSitePageProps) {
  const { host, path } = await params;
  const resolved = await resolveTenantByHostname(host);

  if (!resolved) {
    notFound();
  }

  const requestedPath = `/${(path ?? []).join("/")}`;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6">
      <h1 className="font-heading text-3xl font-bold tracking-tight">Tenant resolved</h1>
      <p className="text-muted">
        Hostname <code className="rounded bg-black/5 px-1.5 py-0.5">{resolved.hostname}</code>{" "}
        maps to tenant{" "}
        <code className="rounded bg-black/5 px-1.5 py-0.5">{resolved.tenantId}</code> (site{" "}
        <code className="rounded bg-black/5 px-1.5 py-0.5">{resolved.siteId}</code>). Requested
        path: <code className="rounded bg-black/5 px-1.5 py-0.5">{requestedPath}</code>.
      </p>
      <p className="text-muted text-sm">
        Placeholder route. The published-page renderer and SEO scaffolding arrive in Step 6.
      </p>
    </main>
  );
}
