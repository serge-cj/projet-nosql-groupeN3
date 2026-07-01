'use client';

import Link from 'next/link';
import { IconCheck, IconClock, IconMapPin, IconUtensils } from '../../components/icons';

const vendorBenefits = [
  'Ajoutez votre restaurant et votre menu en quelques minutes',
  'Recevez les commandes en direct sur votre tableau de bord',
  'Suivez vos ventes et vos performances au quotidien',
];

const delivererBenefits = [
  'Recevez des courses près de chez vous en temps réel',
  'Choisissez votre véhicule et vos horaires de travail',
  'Encaissez directement vos livraisons, sans attente',
];

export default function ProSelectionPage() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col justify-center px-6 py-12">
        <div className="space-y-10">
          <div className="space-y-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Espace professionnel</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Choisissez votre rôle</h1>
            <p className="mx-auto max-w-2xl text-sm text-ink-muted md:text-base">
              Rejoignez Libreville Eats pour développer votre activité : gérez vos commandes, vos livraisons et votre
              croissance depuis un seul espace.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <article className="surface-card flex flex-col rounded-3xl border border-divider p-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
              <div className="flex flex-1 flex-col space-y-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                    <IconUtensils className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-muted">Restaurateur</p>
                    <h2 className="text-xl font-semibold">Gérez votre restaurant</h2>
                  </div>
                </div>
                <p className="text-sm leading-6 text-ink-muted">
                  Recevez des commandes en direct, suivez vos ventes et gérez la livraison de votre restaurant.
                </p>
                <ul className="space-y-2.5 text-sm text-ink-muted">
                  {vendorBenefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2.5">
                      <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex-1" />
                <Link
                  href="/auth/register/vendor"
                  className="btn-primary inline-flex w-full justify-center px-5 py-3 text-sm font-semibold"
                >
                  Je suis restaurateur
                </Link>
              </div>
            </article>

            <article className="surface-card flex flex-col rounded-3xl border border-divider p-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
              <div className="flex flex-1 flex-col space-y-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                    <IconMapPin className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-muted">Coursier</p>
                    <h2 className="text-xl font-semibold">Rejoignez notre réseau de livraison</h2>
                  </div>
                </div>
                <p className="text-sm leading-6 text-ink-muted">
                  Recevez des courses, optimisez vos trajets et encaissez directement vos livraisons.
                </p>
                <ul className="space-y-2.5 text-sm text-ink-muted">
                  {delivererBenefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2.5">
                      <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex-1" />
                <Link
                  href="/auth/register/deliverer"
                  className="btn-primary inline-flex w-full justify-center px-5 py-3 text-sm font-semibold"
                >
                  Je suis coursier
                </Link>
              </div>
            </article>
          </div>

          <div className="flex flex-col items-center gap-2 rounded-2xl border border-divider bg-surface-1 px-6 py-4 text-center text-xs text-ink-muted sm:flex-row sm:justify-center sm:gap-6 sm:text-sm">
            <span className="flex items-center gap-2">
              <IconClock className="h-4 w-4 text-brand" />
              Inscription en moins de 5 minutes
            </span>
            <span className="hidden h-4 w-px bg-divider sm:block" />
            <span className="flex items-center gap-2">
              <IconCheck className="h-4 w-4 text-brand" />
              Aucun frais caché pour démarrer
            </span>
          </div>

          <p className="text-center text-sm text-ink-muted">
            Vous cherchez un compte client ?{' '}
            <Link href="/auth/register" className="font-semibold text-brand hover:underline">
              Créez un compte client
            </Link>
            {' · '}
            Déjà inscrit ?{' '}
            <Link href="/auth/login" className="font-semibold text-brand hover:underline">
              Connectez-vous
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
