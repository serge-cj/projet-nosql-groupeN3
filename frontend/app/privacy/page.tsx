import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-canvas py-16 text-ink lg:py-20">
      <article className="mx-auto max-w-2xl px-6 lg:px-10">
        <header className="mb-10 border-b border-divider pb-8">
          <h1 className="font-display text-4xl font-semibold tracking-tight">Protection de vos données</h1>
          <p className="mt-4 text-lg leading-8 text-ink-muted">
            Nous collectons uniquement les informations nécessaires pour gérer vos commandes, suivre la livraison et sécuriser votre compte.
          </p>
        </header>

        <div className="space-y-6 text-base leading-8 text-ink-muted">
          <p>Nous ne reversons jamais vos informations à des partenaires sans votre consentement.</p>
          <div className="rounded-card border border-divider bg-surface-1 p-6">
            <p className="font-semibold text-ink">Données utilisées</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              <li>Informations de compte : e-mail, rôle et nom d&apos;utilisateur.</li>
              <li>Détails de commande : restaurants, plats, adresse de livraison.</li>
              <li>Préférences de contact et communication de service.</li>
            </ul>
          </div>
          <p className="text-sm">Pour toute question, contactez le support via votre compte.</p>
        </div>

        <Link href="/restaurants" className="btn-primary mt-10">
          Retour aux restaurants
        </Link>
      </article>
    </main>
  );
}
