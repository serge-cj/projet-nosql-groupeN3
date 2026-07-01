'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PageToolbar from '../components/PageToolbar';
import { RestaurantCardSkeleton } from '../components/Skeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const DISTRICTS = [
  'Nombakélé', 'Batavéa', 'Deïdate', 'Gué-Gué', 'Okala', 'Nkembo', 'Akébé', 'Lalala', 'PK5', 'Santa-Marija',
  'Nzeng Ayong', 'Owendo', 'Akanda', '3 Quartiers', 'Glass', 'Baie des Rois', 'Batterie IV', 'Carrefour JDO',
  'Centre-ville', 'Aéroport', 'Montagne Sainte', 'Louis',
];
const CATEGORIES = ['Entrées', 'Plats Principaux', 'Accompagnements', 'Desserts', 'Boissons'];
const PAGE_LIMIT = 12;

interface Dish {
  dishId: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  category?: string;
  image?: string;
  restaurantId: string;
  restaurantName: string;
  district?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface DishesResponse {
  dishes: Dish[];
  pagination: Pagination;
}

export default function PlatsPageClient() {
  const searchParams = useSearchParams();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;
    const district = searchParams.get('district');
    const category = searchParams.get('category');
    if (district) setSelectedDistrict(district);
    if (category) setSelectedCategory(category);
    setInitialized(true);
  }, [searchParams, initialized]);

  useEffect(() => {
    if (!initialized) return;

    const controller = new AbortController();
    if (hasLoadedOnce) {
      setIsPaginating(true);
    } else {
      setIsLoading(true);
    }

    async function fetchDishes() {
      setError('');
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(PAGE_LIMIT),
        });
        if (selectedDistrict) params.set('district', selectedDistrict);
        if (selectedCategory) params.set('category', selectedCategory);

        const response = await fetch(`${API_URL}/restaurants/dishes/search?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error('Impossible de charger les plats.');
        }
        const data = (await response.json()) as DishesResponse;
        setDishes(data.dishes);
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

    fetchDishes();

    return () => controller.abort();
  }, [selectedDistrict, selectedCategory, currentPage, initialized]);

  function selectCategory(category: string) {
    setSelectedCategory((current) => (current === category ? null : category));
    setCurrentPage(1);
  }

  function updateDistrict(value: string) {
    setSelectedDistrict(value || null);
    setCurrentPage(1);
  }

  function resetFilters() {
    setSelectedDistrict(null);
    setSelectedCategory(null);
    setCurrentPage(1);
  }

  const hasActiveFilters = Boolean(selectedDistrict || selectedCategory);

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <PageToolbar
        title="Tous les plats"
        description="Parcours les plats disponibles maintenant chez les restaurants de Libreville, filtre par quartier ou catégorie."
        meta={
          pagination ? (
            <p className="rounded-pill bg-brand/10 px-4 py-2 text-sm font-semibold text-brand-ink">
              {pagination.total} plats disponibles
            </p>
          ) : null
        }
      />

      <section className="border-b border-divider bg-surface-1">
        <div className="mx-auto max-w-6xl space-y-4 px-6 py-6 lg:px-10">
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => selectCategory(category)}
                className={`rounded-pill border px-4 py-2 text-sm font-semibold transition-colors ${
                  selectedCategory === category
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-divider bg-surface-1 text-ink hover:border-brand hover:text-brand'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedDistrict ?? ''}
              onChange={(event) => updateDistrict(event.target.value)}
              className="input-field w-full max-w-xs py-2.5 text-sm"
            >
              <option value="">Tous les quartiers</option>
              {DISTRICTS.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>

            {hasActiveFilters ? (
              <button type="button" onClick={resetFilters} className="text-sm font-semibold text-brand hover:underline">
                Réinitialiser les filtres
              </button>
            ) : null}
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
          ) : dishes.length === 0 ? (
            <div className="surface-card p-12 text-center">
              <p className="text-ink-muted">Aucun plat ne correspond à ces filtres.</p>
              <button type="button" onClick={resetFilters} className="mt-4 text-sm font-semibold text-brand hover:underline">
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
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
