'use client';

import Link from 'next/link';

export default function ProSelectionPage() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col justify-center px-6 py-12">
        <div className="space-y-6">
          <div className="space-y-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Espace professionnel</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Choisissez votre rôle</h1>
            <p className="mx-auto max-w-2xl text-sm text-ink-muted md:text-base">
              Créez un compte dédié pour gérer vos commandes et votre activité sur Libreville Eats.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <article className="surface-card rounded-3xl border border-divider p-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-muted">Restaurateur</p>
                  <h2 className="mt-3 text-2xl font-semibold">Gérez votre restaurant</h2>
                </div>
                <p className="text-sm leading-6 text-ink-muted">
                  Recevez des commandes en direct, suivez vos ventes et gérez la livraison de votre restaurant.
                </p>
                <ul className="space-y-2 text-sm text-ink-muted">
                  <li>• Ajoutez votre restaurant</li>
                  <li>• Gérez vos menus</li>
                  <li>• Suivez les commandes en temps réel</li>
                </ul>
                <Link
                  href="/auth/register/vendor"
                  className="btn-primary inline-flex w-full justify-center px-5 py-3 text-sm font-semibold"
                >
                  Je suis restaurateur
                </Link>
              </div>
            </article>

            <article className="surface-card rounded-3xl border border-divider p-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-muted">Coursier</p>
                  <h2 className="mt-3 text-2xl font-semibold">Rejoignez notre réseau de livraison</h2>
                </div>
                <p className="text-sm leading-6 text-ink-muted">
                  Recevez des courses, optimisez vos trajets et encaissez directement vos livraisons.
                </p>
                <ul className="space-y-2 text-sm text-ink-muted">
                  <li>• Recevez des missions</li>
                  <li>• Choisissez votre véhicule</li>
                  <li>• Suivez votre activité</li>
                </ul>
                <Link
                  href="/auth/register/deliverer"
                  className="btn-primary inline-flex w-full justify-center px-5 py-3 text-sm font-semibold"
                >
                  Je suis coursier
                </Link>
              </div>
            </article>
          </div>

          <p className="text-center text-sm text-ink-muted">
            Vous cherchez un compte client ?{' '}
            <Link href="/auth/register" className="font-semibold text-brand hover:underline">
              Créez un compte client
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
