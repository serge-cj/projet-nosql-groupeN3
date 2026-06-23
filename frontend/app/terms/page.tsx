import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-canvas py-16 text-ink lg:py-20">
      <article className="mx-auto max-w-2xl px-6 lg:px-10">
        <header className="mb-10 border-b border-divider pb-8">
          <h1 className="font-display text-4xl font-semibold tracking-tight">Conditions d&apos;utilisation</h1>
          <p className="mt-4 text-lg leading-8 text-ink-muted">
            Libreville Eats met en relation des clients, des restaurants et des livreurs.
          </p>
        </header>

        <div className="space-y-6 text-base leading-8 text-ink-muted">
          <p>En utilisant le service, vous acceptez les conditions de commande, de paiement et d&apos;utilisation de l&apos;application.</p>
          <div className="rounded-card border border-divider bg-surface-1 p-6">
            <p className="font-semibold text-ink">Points importants</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              <li>Les informations de menu et de disponibilité peuvent varier selon le restaurant.</li>
              <li>Les frais de livraison sont affichés avant validation de la commande.</li>
              <li>Les annulations sont traitées selon la politique du restaurant.</li>
            </ul>
          </div>
          <p className="text-sm">Utilisez l&apos;application de manière responsable et respectueuse des restaurants et des livreurs.</p>
        </div>

        <Link href="/restaurants" className="btn-primary mt-10">
          Retour aux restaurants
        </Link>
      </article>
    </main>
  );
}
