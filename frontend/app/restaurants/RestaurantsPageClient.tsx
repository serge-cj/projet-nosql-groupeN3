'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { IconSearch } from '../components/icons';
import { RestaurantCardSkeleton } from '../components/Skeleton';
import StarRating from '../components/StarRating';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
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

export default function RestaurantsPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;
    const q = searchParams.get('q');
    const page = Number(searchParams.get('page'));
    if (q) {
      setSearch(q);
      setDebouncedSearch(q);
    }
    if (page > 1) setCurrentPage(page);
    setInitialized(true);
  }, [searchParams, initialized]);

  useEffect(() => {
    if (!initialized) return;
    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
    if (currentPage > 1) params.set('page', String(currentPage));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [initialized, debouncedSearch, currentPage, pathname, router]);

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

      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(PAGE_LIMIT),
        });
        const query = debouncedSearch.trim();
        if (query) params.set('q', query);

        const response = await fetch(`${API_URL}/restaurants?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error('Impossible de charger les restaurants.');
        }
        const data = (await response.json()) as RestaurantsResponse;
        setRestaurants(data.restaurants);
        setPagination(data.pagination);
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
  }, [debouncedSearch, currentPage, initialized]);

  function updateSearch(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <section className="border-b border-divider bg-surface-1">
        <div className="mx-auto max-w-6xl space-y-6 px-6 py-8 lg:px-10 lg:py-10">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              Restaurants à Libreville
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-ink-muted">
              Trouve rapidement un restaurant.
            </p>
          </div>

          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand" />
            <input
              type="search"
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Chercher un restaurant…"
              className="input-field border-2 border-brand py-3.5 pl-12 pr-4 w-full"
            />
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
          ) : restaurants.length === 0 ? (
            <div className="surface-card p-12 text-center">
              <p className="text-ink-muted">Aucun restaurant ne correspond à votre recherche.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {restaurants.map((restaurant, index) => {
                  const isOpen = restaurant.isOpen === 'true' || restaurant.isOpen === true;
                  const brandName = restaurant.name.split(' - ')[0].trim();
                  const brandInitials = brandName
                    .split(/\s+/)
                    .map((word) => word[0])
                    .join('')
                    .slice(0, 3)
                    .toUpperCase();

                  return (
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

                        {!restaurant.image && (
                          <div
                            className="absolute bottom-3 left-3 flex h-11 w-11 items-center justify-center rounded-full border border-divider bg-canvas/95 text-xs font-bold uppercase tracking-wide text-brand shadow-soft"
                            title={brandName}
                          >
                            {brandInitials}
                          </div>
                        )}

                        <div className="absolute inset-x-0 top-0 flex justify-between p-4">
                          <span
                            className={`rounded-pill px-3 py-1 text-xs font-semibold ${
                              isOpen ? 'bg-forest-100 text-forest-900' : 'bg-error/10 text-error'
                            }`}
                          >
                            {isOpen ? 'Ouvert' : 'Fermé'}
                          </span>
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
                        </div>
                      </div>
                    </article>
                  </Link>
                  );
                })}
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
