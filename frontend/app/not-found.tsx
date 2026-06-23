import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-canvas py-24 text-ink">
      <div className="mx-auto max-w-lg px-6 lg:px-10">
        <div className="surface-card p-10">
          <h1 className="font-display text-5xl font-semibold">404</h1>
          <p className="mt-4 text-lg leading-8 text-ink-muted">
            La page que vous cherchez n&apos;existe pas encore, ou elle a été déplacée.
          </p>
          <Link href="/restaurants" className="btn-primary mt-8">
            Voir les restaurants
          </Link>
        </div>
      </div>
    </main>
  );
}
