export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="border-b border-border bg-gradient-to-b from-stone-100/80 to-background px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-serif-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
