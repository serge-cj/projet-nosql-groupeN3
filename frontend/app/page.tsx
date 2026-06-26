import Image from 'next/image';
import Link from 'next/link';
import { IconChevronRight, IconClock, IconSearch } from './components/icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const FALLBACK_DISTRICTS = ['Nombakélé', 'Batavéa', 'Okala', 'PK5', 'Gué-Gué', 'Lalala'];

interface DishSummary {
  isAvailable?: boolean;
  quantity?: number;
}

interface MenuSummary {
  dishes?: DishSummary[];
}

interface RestaurantSummary {
  address?: { district?: string };
  menus?: MenuSummary[];
}

interface HomeStats {
  openCount: number;
  districtCount: number;
  availableDishCount: number;
  topDistricts: string[];
}

// Nous calculons ces statistiques à partir de la base réelle (aucune valeur figée) :
// - Ouverts : nous obtenons le total exact via la pagination de l'API (isOpen=true)
// - Plats dispo : nous comptons les plats en stock (isAvailable && quantity > 0) sur un échantillon de restaurants
// - Quartiers : nous retenons les quartiers distincts effectivement couverts par des restaurants
async function getHomeStats(): Promise<HomeStats> {
  try {
    const [openRes, sampleRes] = await Promise.all([
      fetch(`${API_URL}/restaurants?isOpen=true&limit=1`, { cache: 'no-store' }),
      fetch(`${API_URL}/restaurants?limit=100`, { cache: 'no-store' }),
    ]);

    const openTotal = openRes.ok ? ((await openRes.json()).pagination?.total ?? 0) : 0;
    const sample: RestaurantSummary[] = sampleRes.ok ? ((await sampleRes.json()).restaurants ?? []) : [];

    const districtCounts = new Map<string, number>();
    let availableDishCount = 0;

    for (const restaurant of sample) {
      const district = restaurant.address?.district;
      if (district) districtCounts.set(district, (districtCounts.get(district) ?? 0) + 1);
      for (const menu of restaurant.menus ?? []) {
        for (const dish of menu.dishes ?? []) {
          if (dish.isAvailable && (dish.quantity ?? 0) > 0) availableDishCount += 1;
        }
      }
    }

    const topDistricts = [...districtCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([district]) => district);

    return {
      openCount: openTotal,
      districtCount: districtCounts.size,
      availableDishCount,
      topDistricts: topDistricts.length > 0 ? topDistricts : FALLBACK_DISTRICTS,
    };
  } catch {
    return { openCount: 0, districtCount: 0, availableDishCount: 0, topDistricts: FALLBACK_DISTRICTS };
  }
}

const ENTRY_LINKS = [
  { href: '/restaurants', label: 'Parcourir les restaurants', detail: 'Cuisines locales, snacks, menus du jour' },
  { href: '/cart', label: 'Voir mon panier', detail: 'Articles en cours, frais et livraison' },
  { href: '/orders', label: 'Suivre une commande', detail: 'Historique et statut en direct' },
  { href: '/auth/register', label: 'Créer un compte', detail: 'Commandes plus rapides, adresses sauvegardées' },
];

const MARKETING_CARDS = [
  {
    featured: true,
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=1000&q=80',
    title: 'Cuisine de quartier ouverte maintenant',
    description: 'Repère les restaurants qui livrent aujourd’hui et trouve rapidement un plat chaud à emporter.',
  },
  {
    title: 'Promos du jour',
    image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=1000&q=80',
    description: 'Profite des offres locales et découvre les menus en promotion pour une commande maline.',
  },
  {
    title: 'Quartiers qui cartonnent',
    image: 'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?w=1000&q=80',
    description: 'PK5, Santa-Marija ou Nombakélé : explore les zones où la livraison est la plus rapide.',
  },
];

export default async function Home() {
  const stats = await getHomeStats();

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <section className="relative overflow-hidden border-b border-divider">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1727890193720-c1f19c60e966?w=2000&q=80"
            alt="Livreur en veste orange filant à moto avec sa sacoche isotherme"
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-black/85" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pb-12 pt-14 lg:px-10 lg:pb-0 lg:pt-24">
          <div className="grid gap-12 lg:grid-cols-[1.62fr_minmax(300px,1fr)] lg:items-start">
            <div className="lg:pr-6">
              <div
                className="animate-fade-in-up rounded-[2rem] border border-white/10 bg-black/60 px-8 py-10 shadow-[0_35px_90px_rgba(0,0,0,0.32)] backdrop-blur-xl"
                style={{ animationDelay: '40ms' }}
              >
                <div className="flex items-center gap-3 text-white/80">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inset-0 rounded-full bg-mango-400 animate-pulse-ring" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-mango-400" />
                  </span>
                  <p className="font-mono text-xs uppercase tracking-[0.34em]">Libreville Eats · en direct</p>
                  <span className="hidden h-px flex-1 bg-white/20 sm:block" />
                </div>
              </div>

              <h1
                className="mt-6 font-display tracking-[-0.03em] text-white"
                style={{ overflowWrap: 'anywhere' }}
              >
                <span
                  className="animate-fade-in-up block text-[clamp(2.5rem,5vw+1rem,5.5rem)] font-medium leading-[0.96] text-white"
                  style={{ animationDelay: '100ms' }}
                >
                  Vous êtes occupés?
                </span>
                <span
                  className="animate-fade-in-up relative mt-1 inline-block text-[clamp(3.25rem,8vw+1rem,8.75rem)] font-semibold italic leading-[0.88] tracking-[-0.045em] text-mango-300"
                  style={{ animationDelay: '220ms' }}
                >
                  On livre.
                  <svg
                    viewBox="0 0 360 24"
                    preserveAspectRatio="none"
                    className="absolute -bottom-2 left-0 h-3 w-full text-mango-400/80 sm:-bottom-3"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 16C72 6 148 4 180 9C218 15 292 19 356 8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                      className="animate-draw-underline"
                      style={{ animationDelay: '650ms' }}
                    />
                  </svg>
                </span>
              </h1>

              <p
                className="animate-fade-in-up mt-8 max-w-xl text-lg leading-8 text-white/90"
                style={{ animationDelay: '360ms' }}
              >
                Découvre les restaurants ouverts, les promos du jour et les quartiers les plus dynamiques de la ville. À toi de choisir, commander et te faire livrer vite.
              </p>

              <div
                className="animate-fade-in-up mt-9 flex flex-col gap-4 sm:flex-row sm:items-center"
                style={{ animationDelay: '440ms' }}
              >
                <Link
                  href="/restaurants"
                  className="btn-primary rounded-pill px-7 py-4 text-sm font-semibold shadow-lg shadow-mango-950/30 bg-mango-400 text-ink transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:bg-mango-500"
                >
                  Parcourir les restaurants
                </Link>
                <Link
                  href="/auth/register"
                  className="group inline-flex items-center gap-2 rounded-pill bg-white/10 px-4 py-4 text-sm font-semibold text-white transition duration-300 ease-out hover:bg-white/20 hover:text-mango-200"
                >
                  Créer un compte
                  <IconChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>

              <div
                className="animate-fade-in-up mt-14 flex items-stretch divide-x divide-white/15 border-t border-white/15 pt-6"
                style={{ animationDelay: '520ms' }}
              >
                <div className="flex-1 pr-6">
                  <p className="font-mono text-3xl font-medium tabular-nums text-white sm:text-4xl">{stats.openCount}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/55">Ouverts</p>
                </div>
                <div className="flex-1 px-6">
                  <p className="font-mono text-3xl font-medium tabular-nums text-mango-300 sm:text-4xl">{stats.availableDishCount}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/55">Plats dispo</p>
                </div>
                <div className="flex-1 pl-6">
                  <p className="font-mono text-3xl font-medium tabular-nums text-white sm:text-4xl">{stats.districtCount}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/55">Quartiers</p>
                </div>
              </div>
            </div>

            <aside
              className="animate-fade-in-up relative overflow-hidden rounded-card border border-white/10 bg-black/60 shadow-[0_24px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl text-white/90 lg:translate-y-6"
              style={{ animationDelay: '280ms' }}
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-mango-400 via-mango-500 to-forest-500" />
              <div className="p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/75">Commence ici</p>
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
                  {stats.topDistricts.map((district) => (
                    <Link
                      key={district}
                      href={`/restaurants?district=${encodeURIComponent(district)}`}
                      className="rounded-pill border border-divider bg-surface-1 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-brand hover:text-brand"
                    >
                      {district}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          <div className="relative mt-16 lg:-mr-10 lg:mt-20 lg:w-[calc(100%+2.5rem)]">
            <div className="relative h-56 w-full overflow-hidden rounded-card border border-white/10 bg-surface-2/90 shadow-[0_40px_90px_rgba(0,0,0,0.24)] backdrop-blur-sm sm:h-72 lg:h-96 lg:rounded-r-none">
              <Image
                src="https://images.unsplash.com/photo-1526367790999-0150786686a2?w=1600&q=80"
                alt="Livreur à vélo traversant une rue de Libreville"
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
                <div>
                  <p className="font-display text-xl font-semibold text-white sm:text-2xl">
                    Nos livreurs sillonnent Libreville pour toi
                  </p>
                  <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">
                    À vélo, à moto ou à pied : ta commande arrive chaude, où que tu sois en ville.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-start rounded-pill border border-white/20 bg-white/10 px-4 py-2 text-white backdrop-blur-md">
                  <IconClock className="h-4 w-4 text-mango-300" />
                  <span className="font-mono text-sm tabular-nums">~25 min</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="animate-float pointer-events-none mx-auto mt-10 hidden h-9 w-9 items-center justify-center rounded-full border border-white/25 text-white/60 lg:flex"
          >
            <IconChevronRight className="h-4 w-4 -rotate-90" />
          </button>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <div className="grid gap-6 md:grid-cols-3 md:grid-rows-2">
            {MARKETING_CARDS.map((card) => (
              <article
                key={card.title}
                className={`flex flex-col overflow-hidden rounded-card border border-divider bg-surface-1 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-lg ${
                  card.featured ? 'md:col-span-2 md:row-span-2' : ''
                }`}
              >
                <div className={`relative w-full overflow-hidden ${card.featured ? 'h-56 lg:h-72' : 'h-36'}`}>
                  <Image
                    src={card.image}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 60vw, 40vw"
                    className="object-cover"
                  />
                </div>
                <div className={card.featured ? 'flex flex-1 flex-col justify-center p-8' : 'p-6'}>
                  <h2 className={card.featured ? 'font-display text-2xl font-semibold text-ink' : 'font-semibold text-ink'}>
                    {card.title}
                  </h2>
                  <p className={`text-ink-muted ${card.featured ? 'mt-4 text-base leading-7' : 'mt-3 text-sm leading-6'}`}>
                    {card.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-divider bg-canvas/60 py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <h2 className="font-display text-3xl font-semibold text-ink">Vos raccourcis</h2>
          <div className="mt-8 space-y-4">
            <Link
              href={ENTRY_LINKS[0].href}
              className="group flex items-center justify-between rounded-card border border-divider bg-surface-1 px-6 py-7 transition-all duration-300 hover:-translate-y-1 hover:border-brand hover:bg-surface-2 hover:shadow-lg"
            >
              <div className="min-w-0">
                <p className="font-display text-xl font-semibold text-ink">{ENTRY_LINKS[0].label}</p>
                <p className="mt-2 text-sm text-ink-muted">{ENTRY_LINKS[0].detail}</p>
              </div>
              <IconChevronRight className="h-6 w-6 shrink-0 text-brand transition-transform group-hover:translate-x-1" />
            </Link>
            <ul className="grid gap-4 sm:grid-cols-3">
              {ENTRY_LINKS.slice(1).map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex h-full flex-col justify-between rounded-card border border-divider bg-surface-1 px-5 py-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand hover:bg-surface-2"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{link.label}</p>
                      <p className="mt-2 text-sm text-ink-muted">{link.detail}</p>
                    </div>
                    <IconChevronRight className="mt-3 h-5 w-5 shrink-0 text-ink-muted transition-colors group-hover:text-brand" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
