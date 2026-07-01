'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PageToolbar from '../components/PageToolbar';
import { IconSearch, IconClock, IconPlus, IconCheck, IconMapPin } from '../components/icons';
import { RestaurantCardSkeleton } from '../components/Skeleton';
import StarRating from '../components/StarRating';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const DISTRICTS = [
  'Nombakélé', 'Batavéa', 'Deïdate', 'Gué-Gué', 'Okala', 'Nkembo', 'Akébé', 'Lalala', 'PK5', 'Santa-Marija',
  'Nzeng Ayong', 'Owendo', 'Akanda', '3 Quartiers', 'Glass', 'Baie des Rois', 'Batterie IV', 'Carrefour JDO',
  'Centre-ville', 'Aéroport', 'Montagne Sainte', 'Louis',
];
const CUISINES = ['Gabonais', 'Fast-food', 'Italien', 'Asiatique'];
const NEIGHBORHOODS = ['PK5', 'Santa-Marija', 'Nombakélé', 'Glass', 'Owendo'];
const PAGE_LIMIT = 9;

interface Restaurant {
  _id: string;
  name: string;
  rating?: number;
  promo?: string;
  isPlus?: boolean;
  isOpen?: boolean | string;
  cuisine?: string;
  image?: string;
  address?: { district?: string };
  deliveryTime?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface RestaurantsResponse {
  restaurants: Restaurant[];
  pagination: Pagination;
}

interface Dish {
  dishId: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  category?: string;
  isAvailable?: boolean;
  quantity?: number;
  image?: string;
  restaurantId: string;
  restaurantName: string;
  district?: string;
}

interface DishSearchResponse {
  dishes: Dish[];
  pagination: Pagination;
}

export default function RestaurantsPageClient() {
  const searchParams = useSearchParams();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [initialized, setInitialized] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<'OPEN' | 'PROMO' | 'TOP' | 'FAST' | ''>('');

  useEffect(() => {
    if (initialized) return;
    const q = searchParams.get('q');
    const district = searchParams.get('district');
    if (q) {
      setSearch(q);
      setDebouncedSearch(q);
    }
    if (district) setSelectedDistrict(district);
    setInitialized(true);
  }, [searchParams, initialized]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!initialized) return;

    const controller = new AbortController();
    if (hasLoadedOnce) {
      setIsPaginating(true);
    } else {
      setIsLoading(true);
    }

    async function fetchData() {
      setError('');
      const query = debouncedSearch.trim();

      try {
        if (query) {
          // Nous cherchons un plat précis plutôt qu'un restaurant
          const params = new URLSearchParams({
            q: query,
            page: String(currentPage),
            limit: String(PAGE_LIMIT),
          });
          if (selectedDistrict) params.set('district', selectedDistrict);

          const response = await fetch(`${API_URL}/restaurants/dishes/search?${params.toString()}`, {
            signal: controller.signal,
          });
          if (!response.ok) {
            throw new Error('Impossible de charger les plats.');
          }
          const data = (await response.json()) as DishSearchResponse;
          setDishes(data.dishes);
          setRestaurants([]);
          setPagination(data.pagination);
        } else {
          const params = new URLSearchParams({
            page: String(currentPage),
            limit: String(PAGE_LIMIT),
          });

          if (selectedDistrict) params.set('district', selectedDistrict);
          if (selectedCuisine) params.set('cuisine', selectedCuisine);
          if (selectedNeighborhood) params.set('district', selectedNeighborhood);
          if (isOpen) params.set('isOpen', isOpen);
          if (selectedBadge) params.set('badge', selectedBadge);

          const response = await fetch(`${API_URL}/restaurants?${params.toString()}`, {
            signal: controller.signal,
          });
          if (!response.ok) {
            throw new Error('Impossible de charger les restaurants.');
          }
          const data = (await response.json()) as RestaurantsResponse;
          setRestaurants(data.restaurants);
          setDishes([]);
          setPagination(data.pagination);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Erreur réseau');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setIsPaginating(false);
          setHasLoadedOnce(true);
        }
      }
    }

    fetchData();

    return () => controller.abort();
  }, [debouncedSearch, selectedDistrict, isOpen, selectedBadge, currentPage, initialized]);

  function resetFilters() {
    setSearch('');
    setSelectedDistrict(null);
    setIsOpen('');
    setSelectedBadge('');
    setCurrentPage(1);
  }

  function updateSearch(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }

  function updateDistrict(value: string) {
    setSelectedDistrict(value || null);
    setCurrentPage(1);
  }

  function updateOpenStatus(value: string) {
    setIsOpen(value);
    setCurrentPage(1);
  }

  function selectBadge(badge: 'OPEN' | 'PROMO' | 'TOP' | 'FAST' | '') {
    setSelectedBadge(badge);
    setCurrentPage(1);
  }

  function selectCuisine(cuisine: string) {
    setSelectedCuisine((current) => (current === cuisine ? null : cuisine));
    setCurrentPage(1);
  }

  function selectNeighborhood(neighborhood: string) {
    setSelectedNeighborhood((current) => (current === neighborhood ? null : neighborhood));
    setSelectedDistrict(neighborhood || null);
    setCurrentPage(1);
  }

  const isSearchMode = debouncedSearch.trim().length > 0;
  const totalRestaurants = pagination?.total ?? (isSearchMode ? dishes.length : restaurants.length);
  const bestOfferRestaurant = restaurants.find((restaurant) => restaurant.promo || restaurant.isPlus);

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <section className="border-b border-divider bg-surface-1">
        <div className="mx-auto max-w-6xl space-y-6 px-6 py-8 lg:px-10 lg:py-10">
          <div className="grid gap-6 lg:grid-cols-[1.5fr_minmax(0,1fr)] lg:items-end">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Découverte</p>
              <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                Restaurants à Libreville
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-ink-muted">
                Trouve les tables ouvertes maintenant, les promotions du jour et les quartiers qui font parler d&apos;eux.
              </p>
            </div>

            <div className="grid gap-3 rounded-card border border-divider bg-canvas p-5 text-sm text-ink-muted shadow-soft">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-pill bg-brand/10 px-3 py-2 text-center text-brand-ink">12 ouverts</div>
                <div className="rounded-pill bg-promo/10 px-3 py-2 text-center text-brand-ink">4 promos</div>
                <div className="rounded-pill bg-surface-1 px-3 py-2 text-center">10 quartiers</div>
              </div>
              <p className="text-sm">Affiche maintenant les meilleures offres du moment et les restaurants qui préparent vite.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
              <div className="rounded-card border border-divider bg-surface-1 p-5 shadow-soft">
                <p className="text-sm text-ink-muted">Je veux</p>
                <h3 className="mt-3 text-lg font-semibold text-ink">Trouver vite</h3>
                <p className="mt-2 text-sm text-ink-muted">Choisis un parcours pour filtrer rapidement les options.</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    { id: 'OPEN', label: 'Ouvert maintenant', icon: IconClock },
                    { id: 'PROMO', label: 'Promos', icon: IconPlus },
                    { id: 'TOP', label: 'Top notés', icon: IconCheck },
                    { id: 'FAST', label: 'Livraison rapide', icon: IconMapPin },
                  ].map((badge) => (
                    <button
                      key={badge.id}
                      type="button"
                      onClick={() => selectBadge(badge.id as 'OPEN' | 'PROMO' | 'TOP' | 'FAST' | '')}
                      className={`w-full sm:w-auto rounded-pill border px-4 py-3 text-sm font-semibold transition duration-200 flex items-center gap-3 justify-center ${
                        selectedBadge === badge.id
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-divider bg-surface-1 text-ink hover:border-brand hover:bg-brand/5 hover:text-brand'
                      }`}
                    >
                      {badge.icon ? (
                        <span className="flex items-center gap-2">
                          <badge.icon className="h-4 w-4 text-current" />
                          <span>{badge.label}</span>
                        </span>
                      ) : (
                        badge.label
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-card border border-divider bg-surface-1 p-5 shadow-soft">
                  <p className="text-sm text-ink-muted">Quartiers chauds</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {NEIGHBORHOODS.map((neighborhood) => (
                      <button
                        key={neighborhood}
                        type="button"
                        onClick={() => selectNeighborhood(neighborhood)}
                        className={`w-full sm:w-auto rounded-pill border px-4 py-3 text-sm font-semibold transition duration-200 flex items-center gap-2 justify-center ${
                          selectedNeighborhood === neighborhood
                            ? 'border-brand bg-brand/10 text-brand'
                            : 'border-divider bg-surface-1 text-ink hover:border-brand hover:bg-brand/5 hover:text-brand'
                        }`}
                      >
                        <IconMapPin className="h-4 w-4 text-current" />
                        <span>{neighborhood}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-card border border-divider bg-surface-1 p-5 shadow-soft">
                  <p className="text-sm text-ink-muted">Offres du jour</p>
                  <div className="mt-3">
                    <p className="text-lg font-semibold text-ink">4 promos actives</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="relative sm:col-span-2">
                <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => updateSearch(event.target.value)}
                  placeholder="Chercher un restaurant, une cuisine ou un plat…"
                  className="input-field border-2 border-brand py-3.5 pl-12 pr-4 w-full"
                />
              </div>

              <div className="flex items-center gap-3">
                <button type="button" onClick={resetFilters} className="btn-secondary w-full sm:w-auto whitespace-nowrap px-4 py-3 text-sm">
                  Réinitialiser
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage(1);
                    setDebouncedSearch(search);
                  }}
                  className="btn-primary w-full sm:w-auto px-4 py-3 text-sm"
                >
                  Explorer
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-card border border-divider bg-surface-1 p-4 text-sm">
                <p className="text-ink-muted">Résultats</p>
                <p className="mt-2 text-lg font-semibold text-ink">
                  {totalRestaurants} {isSearchMode ? 'plats' : 'restaurants'}
                </p>
              </div>
              <div className="rounded-card border border-divider bg-surface-1 p-4 text-sm">
                <p className="text-ink-muted">Quartier actif</p>
                <p className="mt-2 text-lg font-semibold text-ink">{selectedDistrict || 'Tous'}</p>
              </div>
              <div className="rounded-card border border-divider bg-surface-1 p-4 text-sm">
                <p className="text-ink-muted">Meilleure offre</p>
                {isSearchMode ? (
                  <p className="mt-2 text-lg font-semibold text-ink">Recherche de plats en cours</p>
                ) : bestOfferRestaurant ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-lg font-semibold text-ink">{bestOfferRestaurant.name}</p>
                    {bestOfferRestaurant.promo ? (
                      <p className="rounded-pill bg-promo/10 px-3 py-1 text-xs font-semibold text-brand-ink inline-flex">
                        {bestOfferRestaurant.promo}
                      </p>
                    ) : (
                      <p className="rounded-pill bg-brand/10 px-3 py-1 text-xs font-semibold text-brand inline-flex">Top noté</p>
                    )}
                    <p className="text-sm text-ink-muted">{bestOfferRestaurant.cuisine || bestOfferRestaurant.address?.district}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-lg font-semibold text-ink">Aucune promo actuelle</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 lg:py-14">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Chargement">
              {Array.from({ length: 6 }).map((_, i) => (
                <RestaurantCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-card border border-error/30 bg-error/5 p-12 text-center text-error">{error}</div>
          ) : (isSearchMode ? dishes.length === 0 : restaurants.length === 0) ? (
            <div className="surface-card p-12 text-center">
              <p className="text-ink-muted">
                {isSearchMode ? 'Aucun plat ne correspond à votre recherche.' : 'Aucun restaurant ne correspond à votre recherche.'}
              </p>
              <button type="button" onClick={resetFilters} className="mt-4 text-sm font-semibold text-brand hover:underline">
                Réinitialiser les filtres
              </button>
            </div>
          ) : isSearchMode ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {dishes.map((dish, index) => (
                  <Link key={dish.dishId} href={`/restaurants/${dish.restaurantId}?dish=${dish.dishId}`}>
                    <article
                      className="group flex flex-col overflow-hidden rounded-card border border-divider bg-surface-1 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-brand hover:shadow-lg"
                      style={{ animationDelay: `${index * 0.06}s` }}
                    >
                      <div className="relative h-44 overflow-hidden bg-soft">
                        {dish.image ? (
                          <Image
                            src={dish.image}
                            alt={`Photo de ${dish.name}`}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                            className="object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(62,153,255,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,168,0,0.18),transparent_30%)]" />
                        )}

                        {dish.category && (
                          <div className="absolute inset-x-0 top-0 flex justify-between p-4">
                            <span className="rounded-pill bg-forest-100 px-3 py-1 text-xs font-semibold text-forest-900">{dish.category}</span>
                          </div>
                        )}

                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-canvas/95 to-transparent" />
                      </div>

                      <div className="flex flex-1 flex-col space-y-4 p-5">
                        <div className="min-h-[5.5rem]">
                          <h2 className="font-display text-lg font-semibold text-ink transition-colors group-hover:text-brand">
                            {dish.name}
                          </h2>
                          <p className="mt-2 text-sm text-ink-muted">
                            Chez {dish.restaurantName}
                            {dish.district ? ` · ${dish.district}` : ''}
                          </p>
                        </div>

                        <div className="grid gap-2 text-sm text-ink-muted">
                          <div className="flex items-center justify-between gap-2 rounded-pill border border-divider bg-surface-1 px-3 py-2">
                            <span className="font-mono font-semibold text-mango-700">
                              {dish.price} {dish.currency || 'FCFA'}
                            </span>
                            <span className="text-xs text-ink-muted">{dish.isAvailable ? 'Disponible' : 'Indisponible'}</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>

              {pagination && pagination.totalPages > 1 ? (
                <div className="mt-10 flex flex-col items-center justify-between gap-4 surface-card p-4 text-sm text-ink-muted sm:flex-row">
                  <span>
                    Page <strong className="text-ink">{pagination.page}</strong> sur{' '}
                    <strong className="text-ink">{pagination.totalPages}</strong>
                  </span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                      disabled={!pagination.hasPrev || isPaginating}
                      className="btn-secondary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isPaginating ? '…' : 'Précédent'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => page + 1)}
                      disabled={!pagination.hasNext || isPaginating}
                      className="btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isPaginating ? '…' : 'Suivant'}
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {restaurants.map((restaurant, index) => (
                  <Link key={restaurant._id} href={`/restaurants/${restaurant._id}`}>
                    <article className="group flex flex-col overflow-hidden rounded-card border border-divider bg-surface-1 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-brand hover:shadow-lg" style={{ animationDelay: `${index * 0.06}s` }}>
                      <div className="relative h-44 overflow-hidden bg-soft">
                        {restaurant.image ? (
                          <Image
                            src={restaurant.image}
                            alt={`Photo de ${restaurant.name}`}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                            className="object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(62,153,255,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,168,0,0.18),transparent_30%)]" />
                        )}

                        <div className="absolute inset-x-0 top-0 flex justify-between p-4">
                          <span className="rounded-pill bg-forest-100 px-3 py-1 text-xs font-semibold text-forest-900">{restaurant.isOpen === 'true' || restaurant.isOpen ? 'Ouvert' : 'Fermé'}</span>
                          {(restaurant.isPlus || restaurant.promo) && (
                            <span className={`rounded-pill px-3 py-1 text-xs font-semibold ${restaurant.isPlus ? 'bg-mango-500 text-mango-900' : 'bg-promo text-mango-900'}`}>
                              {restaurant.isPlus ? 'TOP' : 'PROMO'}
                            </span>
                          )}
                        </div>

                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-canvas/95 to-transparent" />
                      </div>

                      <div className="flex flex-1 flex-col space-y-4 p-5">
                        <div className="min-h-[5.5rem]">
                          <h2 className="font-display text-lg font-semibold text-ink transition-colors group-hover:text-brand">
                            {restaurant.name}
                          </h2>
                          <p className="mt-2 text-sm text-ink-muted">{restaurant.cuisine || restaurant.address?.district || 'Cuisine locale'}</p>
                        </div>

                        <div className="grid gap-2 text-sm text-ink-muted">
                          <div className="flex items-center justify-between gap-2 rounded-pill border border-divider bg-surface-1 px-3 py-2">
                            <span className="font-mono font-semibold text-mango-700">{restaurant.rating ? restaurant.rating.toFixed(1) : '—'}</span>
                            {restaurant.rating ? <StarRating rating={restaurant.rating} size={14} /> : null}
                          </div>
                          <div className="flex items-center justify-between gap-2 rounded-pill border border-divider bg-surface-1 px-3 py-2">
                            <span>{restaurant.deliveryTime ?? '30-40'} min</span>
                            <span className="text-xs text-ink-muted">Livraison estimée</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>

              {pagination && pagination.totalPages > 1 ? (
                <div className="mt-10 flex flex-col items-center justify-between gap-4 surface-card p-4 text-sm text-ink-muted sm:flex-row">
                  <span>
                    Page <strong className="text-ink">{pagination.page}</strong> sur{' '}
                    <strong className="text-ink">{pagination.totalPages}</strong>
                  </span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                      disabled={!pagination.hasPrev || isPaginating}
                      className="btn-secondary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isPaginating ? '…' : 'Précédent'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => page + 1)}
                      disabled={!pagination.hasNext || isPaginating}
                      className="btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isPaginating ? '…' : 'Suivant'}
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
