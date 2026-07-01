import Image from 'next/image';
import Link from 'next/link';
import { IconChevronRight } from './components/icons';
import HomeLiveBadge from './components/HomeLiveBadge';
import VendorHomeRedirect from './components/VendorHomeRedirect';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface DishSummary {
  _id?: string;
  name?: string;
  price?: number;
  currency?: string;
  image?: string;
  category?: string;
  isAvailable?: boolean;
  quantity?: number;
}

interface MenuSummary {
  dishes?: DishSummary[];
}

interface RestaurantSummary {
  _id: string;
  name: string;
  address?: { district?: string };
  menus?: MenuSummary[];
}

interface HomeStats {
  openCount: number;
  districtCount: number;
  availableDishCount: number;
}

interface LiveOrderStats {
  preparing: number;
  onTheWay: number;
  delivered: number;
}

interface FeaturedDish {
  dishId: string;
  name: string;
  price: number;
  currency: string;
  image?: string;
  category?: string;
  restaurantId: string;
  restaurantName: string;
  district?: string;
}

const FEATURED_DISH_COUNT = 9;

// Nous extrayons ici une sélection de plats disponibles à mettre en avant sur l'accueil,
// en privilégiant la diversité des restaurants (un plat par restaurant dans un premier passage).
function pickFeaturedDishes(restaurants: RestaurantSummary[]): FeaturedDish[] {
  const byRestaurant: FeaturedDish[][] = restaurants.map((restaurant) => {
    const dishes: FeaturedDish[] = [];
    for (const menu of restaurant.menus ?? []) {
      for (const dish of menu.dishes ?? []) {
        if (dish.isAvailable && (dish.quantity ?? 0) > 0 && dish._id && dish.name && dish.price != null) {
          dishes.push({
            dishId: dish._id,
            name: dish.name,
            price: dish.price,
            currency: dish.currency || 'FCFA',
            image: dish.image,
            category: dish.category,
            restaurantId: restaurant._id,
            restaurantName: restaurant.name,
            district: restaurant.address?.district,
          });
        }
      }
    }
    return dishes;
  });

  const featured: FeaturedDish[] = [];
  let round = 0;
  while (featured.length < FEATURED_DISH_COUNT) {
    let addedAny = false;
    for (const dishes of byRestaurant) {
      if (dishes[round]) {
        featured.push(dishes[round]);
        addedAny = true;
        if (featured.length >= FEATURED_DISH_COUNT) break;
      }
    }
    if (!addedAny) break;
    round += 1;
  }

  return featured;
}

// Contrairement à pickFeaturedDishes, on ne limite ni le nombre de plats ni un par restaurant :
// on récupère la totalité des plats disponibles, pour alimenter le mur façon Pinterest.
function pickAllDishes(restaurants: RestaurantSummary[]): FeaturedDish[] {
  const dishes: FeaturedDish[] = [];
  for (const restaurant of restaurants) {
    for (const menu of restaurant.menus ?? []) {
      for (const dish of menu.dishes ?? []) {
        if (dish.isAvailable && (dish.quantity ?? 0) > 0 && dish._id && dish.name && dish.price != null) {
          dishes.push({
            dishId: dish._id,
            name: dish.name,
            price: dish.price,
            currency: dish.currency || 'FCFA',
            image: dish.image,
            category: dish.category,
            restaurantId: restaurant._id,
            restaurantName: restaurant.name,
            district: restaurant.address?.district,
          });
        }
      }
    }
  }
  return dishes;
}

// Nous calculons ces statistiques à partir de la base réelle (aucune valeur figée) :
// - Ouverts : nous obtenons le total exact via la pagination de l'API (isOpen=true)
// - Plats dispo : nous comptons les plats en stock (isAvailable && quantity > 0) sur un échantillon de restaurants
// - Quartiers : nous retenons les quartiers distincts effectivement couverts par des restaurants
async function getHomeStats(): Promise<{ stats: HomeStats; featuredDishes: FeaturedDish[]; allDishes: FeaturedDish[] }> {
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

    return {
      stats: {
        openCount: openTotal,
        districtCount: districtCounts.size,
        availableDishCount,
      },
      featuredDishes: pickFeaturedDishes(sample),
      allDishes: pickAllDishes(sample),
    };
  } catch {
    return {
      stats: { openCount: 0, districtCount: 0, availableDishCount: 0 },
      featuredDishes: [],
      allDishes: [],
    };
  }
}

// Nous récupérons ici le nombre réel de commandes en préparation, en route et livrées
// (dernières 24h) pour animer le badge "en direct" avec des données vivantes.
async function getLiveOrderStats(): Promise<LiveOrderStats> {
  try {
    const res = await fetch(`${API_URL}/orders/live-stats`, { cache: 'no-store' });
    if (!res.ok) throw new Error('live-stats request failed');
    const data = await res.json();
    return {
      preparing: data.stats?.preparing ?? 0,
      onTheWay: data.stats?.onTheWay ?? 0,
      delivered: data.stats?.delivered ?? 0,
    };
  } catch {
    return { preparing: 0, onTheWay: 0, delivered: 0 };
  }
}

const ENTRY_LINKS = [
  { href: '/restaurants', label: 'Parcourir les restaurants', detail: 'Cuisines locales, snacks, menus du jour' },
  { href: '/cart', label: 'Voir mon panier', detail: 'Articles en cours, frais et livraison' },
  { href: '/orders', label: 'Suivre une commande', detail: 'Historique et statut en direct' },
  { href: '/auth/register', label: 'Créer un compte', detail: 'Commandes plus rapides, adresses sauvegardées' },
];

const MASONRY_COLUMN_COUNT = 4;
const MASONRY_CARD_HEIGHTS = ['h-40', 'h-56', 'h-72'];

export default async function Home() {
  const [{ stats, featuredDishes, allDishes }, liveOrders] = await Promise.all([
    getHomeStats(),
    getLiveOrderStats(),
  ]);

  const masonryColumns: FeaturedDish[][] = Array.from({ length: MASONRY_COLUMN_COUNT }, () => []);
  allDishes.forEach((dish, index) => {
    masonryColumns[index % MASONRY_COLUMN_COUNT].push(dish);
  });

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <VendorHomeRedirect />
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
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between lg:gap-10">
            <div className="order-2 lg:order-1 lg:max-w-2xl">
              <h1
                className="font-display tracking-[-0.03em] text-white"
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
                Découvre les plats disponibles maintenant, les promos du jour et les quartiers les plus dynamiques de la ville. Choisis ton plat, commande et fais-toi livrer vite.
              </p>

              <div
                className="animate-fade-in-up mt-9 flex flex-col gap-4 sm:flex-row sm:items-center"
                style={{ animationDelay: '440ms' }}
              >
                <Link
                  href="#plats-du-moment"
                  className="btn-primary rounded-pill px-7 py-4 text-sm font-semibold shadow-lg shadow-mango-950/30 bg-mango-400 text-ink transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:bg-mango-500"
                >
                  Voir les plats du jour
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
                className="animate-fade-in-up mt-14 flex items-stretch divide-x divide-white/15 border-t border-white/15 pt-6 sm:max-w-2xl"
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

            <div className="order-1 mb-8 lg:order-2 lg:mb-0 lg:mt-2 lg:w-80 lg:shrink-0">
              <HomeLiveBadge initialStats={liveOrders} />
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

      <section id="plats-du-moment" className="border-b border-divider py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">À l&apos;affiche</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Plats du moment
              </h2>
              <p className="mt-3 max-w-xl text-base text-ink-muted">
                Une sélection de plats disponibles tout de suite, chez plusieurs restaurants de Libreville.
              </p>
            </div>
            <Link href="/plats" className="text-sm font-semibold text-brand hover:underline">
              Voir plus de plats →
            </Link>
          </div>

          {featuredDishes.length === 0 ? (
            <div className="mt-8 rounded-card border border-divider bg-surface-1 p-10 text-center text-ink-muted">
              Aucun plat disponible pour le moment.
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredDishes.map((dish) => (
                <Link
                  key={dish.dishId}
                  href={`/restaurants/${dish.restaurantId}?dish=${dish.dishId}`}
                  className="group flex flex-col overflow-hidden rounded-card border border-divider bg-surface-1 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-lg"
                >
                  <div className="relative h-44 w-full overflow-hidden bg-soft">
                    {dish.image ? (
                      <Image
                        src={dish.image}
                        alt={dish.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(62,153,255,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,168,0,0.18),transparent_30%)]" />
                    )}
                    {dish.category && (
                      <span className="absolute left-4 top-4 rounded-pill bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                        {dish.category}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <h3 className="font-display text-lg font-semibold text-ink transition-colors group-hover:text-brand">
                      {dish.name}
                    </h3>
                    <p className="text-sm text-ink-muted">
                      {dish.restaurantName}
                      {dish.district ? ` · ${dish.district}` : ''}
                    </p>
                    <p className="mt-auto font-mono text-base font-semibold text-mango-700">
                      {dish.price.toLocaleString()} {dish.currency}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {allDishes.length > 0 ? (
        <section className="overflow-hidden border-b border-divider bg-surface-1 py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-6 lg:px-10">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Toute la carte de Libreville
            </h2>
            <p className="mt-3 max-w-xl text-base text-ink-muted">
              L&apos;intégralité des plats disponibles chez nos restaurants partenaires, en un coup d&apos;œil.
            </p>
          </div>

          <div className="relative mt-8 h-[560px] [mask-image:linear-gradient(to_bottom,transparent,black_8%,black_92%,transparent)]">
            <div className="mx-auto grid h-full max-w-6xl grid-cols-2 gap-4 px-6 sm:grid-cols-3 lg:grid-cols-4 lg:px-10">
              {masonryColumns.map((columnDishes, columnIndex) => (
                <div
                  key={columnIndex}
                  className={`overflow-hidden ${
                    columnIndex === 2 ? 'hidden sm:block' : columnIndex === 3 ? 'hidden lg:block' : ''
                  }`}
                >
                  <div
                    className={`flex flex-col gap-4 has-[a:hover]:[animation-play-state:paused] ${
                      columnIndex % 2 === 0 ? 'animate-marquee-vertical' : 'animate-marquee-vertical-reverse'
                    }`}
                    style={{ animationDuration: `${Math.max(columnDishes.length, 6) * 10 + columnIndex * 4}s` }}
                  >
                    {[...columnDishes, ...columnDishes].map((dish, index) => (
                      <Link
                        key={`${dish.dishId}-${index}`}
                        href={`/restaurants/${dish.restaurantId}?dish=${dish.dishId}`}
                        className="group/card block overflow-hidden rounded-card border border-divider bg-canvas shadow-soft transition-colors hover:border-brand"
                      >
                        <div className={`relative w-full overflow-hidden ${MASONRY_CARD_HEIGHTS[index % MASONRY_CARD_HEIGHTS.length]}`}>
                          {dish.image ? (
                            <Image
                              src={dish.image}
                              alt={dish.name}
                              fill
                              sizes="(max-width: 640px) 50vw, 25vw"
                              className="object-cover transition duration-500 group-hover/card:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(62,153,255,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,168,0,0.18),transparent_30%)]" />
                          )}
                        </div>
                        <div className="p-3">
                          <p className="truncate text-sm font-semibold text-ink">{dish.name}</p>
                          <p className="truncate text-xs text-ink-muted">{dish.restaurantName}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

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
