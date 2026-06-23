import Link from 'next/link';
import { IconChevronRight, IconSearch } from './components/icons';

const DISTRICTS = ['Nombakélé', 'Batavéa', 'Okala', 'PK5', 'Gué-Gué', 'Lalala'];

const ENTRY_LINKS = [
  { href: '/restaurants', label: 'Parcourir les restaurants', detail: 'Cuisines locales, snacks, menus du jour' },
  { href: '/cart', label: 'Voir mon panier', detail: 'Articles en cours, frais et livraison' },
  { href: '/orders', label: 'Suivre une commande', detail: 'Historique et statut en direct' },
  { href: '/auth/register', label: 'Créer un compte', detail: 'Commandes plus rapides, adresses sauvegardées' },
];

const MARKETING_CARDS = [
  {
    title: 'Cuisine de quartier ouverte maintenant',
    description: 'Repère les restaurants qui livrent aujourd’hui et trouve rapidement un plat chaud à emporter.',
  },
  {
    title: 'Promos du jour',
    description: 'Profite des offres locales et découvre les menus en promotion pour une commande maline.',
  },
  {
    title: 'Quartiers qui cartonnent',
    description: 'PK5, Santa-Marija ou Nombakélé : explore les zones où la livraison est la plus rapide.',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <section className="border-b border-divider bg-surface-1">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[1.4fr_minmax(320px,1fr)] lg:items-center">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand">Libreville Eats</p>
              <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight text-ink sm:text-6xl" style={{ overflowWrap: 'anywhere' }}>
                Ta page marketing pour commander local à Libreville
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-muted">
                Découvre les restaurants ouverts, les promos du jour et les quartiers les plus dynamiques de la ville. À toi de choisir, commander et te faire livrer vite.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link href="/restaurants" className="btn-primary rounded-pill px-6 py-4 text-sm font-semibold">
                  Parcourir les restaurants
                </Link>
                <Link href="/auth/register" className="btn-secondary rounded-pill px-6 py-4 text-sm font-semibold">
                  Créer un compte
                </Link>
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-3">
                <div className="rounded-card border border-divider bg-canvas px-5 py-5 text-center">
                  <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Ouverts</p>
                  <p className="mt-3 text-3xl font-semibold text-ink">12</p>
                </div>
                <div className="rounded-card border border-divider bg-canvas px-5 py-5 text-center">
                  <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Promos</p>
                  <p className="mt-3 text-3xl font-semibold text-ink">4</p>
                </div>
                <div className="rounded-card border border-divider bg-canvas px-5 py-5 text-center">
                  <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Quartiers</p>
                  <p className="mt-3 text-3xl font-semibold text-ink">8</p>
                </div>
              </div>
            </div>

            <aside className="rounded-card border border-divider bg-surface-1 p-6 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ink-muted">Commence ici</p>
              <form action="/restaurants" method="get" className="mt-6 space-y-4">
                <label className="sr-only" htmlFor="hero-search">
                  Chercher un restaurant
                </label>
                <div className="relative">
                  <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" />
                  <input
                    id="hero-search"
                    name="q"
                    type="search"
                    placeholder="Chercher un restaurant, un plat…"
                    className="input-field w-full rounded-pill border border-divider bg-canvas py-4 pl-12 pr-4 text-sm"
                  />
                </div>
                <button type="submit" className="btn-primary w-full rounded-pill px-6 py-4 text-sm font-semibold">
                  Rechercher
                </button>
              </form>

              <div className="mt-6 text-sm text-ink-muted">Quartiers populaires</div>
              <div className="mt-4 flex flex-wrap gap-3">
                {DISTRICTS.map((district) => (
                  <Link
                    key={district}
                    href={`/restaurants?district=${encodeURIComponent(district)}`}
                    className="rounded-pill border border-divider bg-surface-1 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-brand hover:text-brand"
                  >
                    {district}
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <div className="grid gap-6 md:grid-cols-3">
            {MARKETING_CARDS.map((card) => (
              <article key={card.title} className="rounded-card border border-divider bg-surface-1 p-6 shadow-soft">
                <h2 className="font-semibold text-ink">{card.title}</h2>
                <p className="mt-3 text-sm leading-6 text-ink-muted">{card.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-divider bg-canvas/60 py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <h2 className="font-display text-3xl font-semibold text-ink">Vos raccourcis</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {ENTRY_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group flex items-center justify-between rounded-card border border-divider bg-surface-1 px-5 py-5 transition-colors hover:border-brand hover:bg-surface-2"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{link.label}</p>
                    <p className="mt-2 text-sm text-ink-muted">{link.detail}</p>
                  </div>
                  <IconChevronRight className="h-5 w-5 shrink-0 text-ink-muted transition-colors group-hover:text-brand" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
