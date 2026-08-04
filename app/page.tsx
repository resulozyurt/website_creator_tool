export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6">
      <h1 className="font-heading text-3xl font-bold tracking-tight">
        FieldPie Website Builder
      </h1>
      <p className="text-muted">
        Project scaffold is up and running. Feature modules live under{" "}
        <code className="rounded bg-black/5 px-1.5 py-0.5">src/</code>. This placeholder
        page is replaced by the public tenant renderer and the admin builder in later
        steps.
      </p>
    </main>
  );
}
