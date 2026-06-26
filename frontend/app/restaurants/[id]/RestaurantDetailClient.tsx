'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import api from '@/lib/api';
import CartDrawer from '@/app/components/CartDrawer';
import { IconCart, IconCheck } from '@/app/components/icons';
import { loadCart, saveCart, addToCart as cartHelperAddToCart, getCartTotal } from '@/lib/cartHelper';

interface Props {
  params: { id: string };
}

interface Dish {
  _id?: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  category?: string;
  isAvailable?: boolean;
  preparationTime?: number;
  image?: string;
}

interface Menu {
  name: string;
  description?: string;
  dishes: Dish[];
}

interface Restaurant {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  image?: string;
  isOpen?: boolean;
  rating?: number;
  reviewCount?: number;
  address?: {
    street?: string;
    district?: string;
    city?: string;
  };
  deliveryZones?: { deliveryFee?: number; deliveryTime?: number }[];
  menus?: Menu[];
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  restaurantId: string;
  restaurantName: string;
  dishId: string;
  dishName: string;
  unitPrice: number;
  quantity: number;
  image?: string;
}

export default function RestaurantDetailClient({ params }: Props) {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addedItemMessage, setAddedItemMessage] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerOpenedOnce, setDrawerOpenedOnce] = useState(false);
  const [justAddedDishId, setJustAddedDishId] = useState<string | null>(null);
  const [cartPulse, setCartPulse] = useState(false);
  const [pendingDish, setPendingDish] = useState<Dish | null>(null);

  useEffect(() => {
    setCartItems(loadCart());
  }, []);

  useEffect(() => {
    async function fetchRestaurant() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/restaurants/${params.id}`);
        setRestaurant(response.data.restaurant);
      } catch (err: any) {
        setError(err.response?.data?.message ?? 'Impossible de charger le restaurant');
      } finally {
        setLoading(false);
      }
    }

    fetchRestaurant();
  }, [params.id]);

  const totalCartItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );
  const currentCartTotal = useMemo(() => getCartTotal(cartItems), [cartItems]);

  function handleToggleDrawer() {
    setDrawerOpen((value) => !value);
  }

  function handleViewCart() {
    setDrawerOpen(false);
    router.push('/cart');
  }

  const deliveryInfo = restaurant?.deliveryZones?.[0];
  const menuCount = restaurant?.menus?.reduce((count, menu) => count + menu.dishes.length, 0) ?? 0;

  const categoryGroups = useMemo(() => {
    if (!restaurant) return [] as { category: string; dishes: Dish[] }[];
    const categoryOrder = ['Entrées', 'Plats Principaux', 'Desserts', 'Boissons'];
    const allDishes = restaurant.menus?.flatMap((menu) => menu.dishes ?? []) ?? [];
    const grouped = allDishes.reduce<Record<string, Dish[]>>((acc, dish) => {
      const category = dish.category || 'Autres';
      acc[category] = acc[category] || [];
      acc[category].push(dish);
      return acc;
    }, {});
    const ordered = categoryOrder.filter((c) => grouped[c]).map((c) => ({ category: c, dishes: grouped[c] }));
    const other = Object.keys(grouped).filter((c) => !categoryOrder.includes(c));
    return [...ordered, ...other.map((c) => ({ category: c, dishes: grouped[c] }))];
  }, [restaurant]);

  const slugifyCategory = (category: string) =>
    category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  function commitAddToCart(dish: Dish, baseCart: CartItem[]) {
    if (!restaurant || !dish._id) return;

    const updatedCart = cartHelperAddToCart(dish, restaurant, baseCart);
    setCartItems(updatedCart);
    saveCart(updatedCart);
    setAddedItemMessage(`${dish.name} ajouté au panier`);
    window.setTimeout(() => setAddedItemMessage(''), 2200);

    const dishId = dish._id;
    setJustAddedDishId(dishId);
    window.setTimeout(() => setJustAddedDishId((current) => (current === dishId ? null : current)), 1400);

    if (!drawerOpenedOnce) {
      setDrawerOpen(true);
      setDrawerOpenedOnce(true);
    } else {
      setCartPulse(true);
      window.setTimeout(() => setCartPulse(false), 600);
    }
  }

  function handleAddToCart(dish: Dish) {
    if (!restaurant || !dish._id) {
      setAddedItemMessage('Impossible d\'ajouter ce plat au panier.');
      window.setTimeout(() => setAddedItemMessage(''), 2200);
      return;
    }

    const hasItemsFromAnotherRestaurant = cartItems.some((item) => item.restaurantId !== restaurant._id);
    if (hasItemsFromAnotherRestaurant) {
      setPendingDish(dish);
      return;
    }

    commitAddToCart(dish, cartItems);
  }

  function handleConfirmReplaceCart() {
    if (!pendingDish) return;
    commitAddToCart(pendingDish, []);
    setPendingDish(null);
  }

  function handleCancelReplaceCart() {
    setPendingDish(null);
  }

  return (
    <main id="top" className="min-h-screen bg-canvas text-ink pb-24">
      <section className="border-b border-divider bg-surface-1">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10">
          {loading ? (
            <p className="text-ink-muted">Chargement du restaurant…</p>
          ) : error ? (
            <p className="text-error">{error}</p>
          ) : restaurant ? (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span
                      className={`rounded-pill px-3 py-1 text-xs font-semibold ${
                        restaurant.isOpen ? 'bg-forest-100 text-forest-900' : 'bg-surface-1 text-ink'
                      }`}
                    >
                      {restaurant.isOpen ? 'Ouvert' : 'Fermé'}
                    </span>
                    <span className="rounded-pill border border-divider bg-surface-1 px-3 py-1 text-xs font-semibold text-ink">
                      {restaurant.address?.district || 'Libreville'}
                    </span>
                    <span className="rounded-pill border border-divider bg-surface-1 px-3 py-1 text-xs font-semibold text-ink">
                      {restaurant.rating ? `${restaurant.rating.toFixed(1)}` : 'Nouveau'}
                    </span>
                  </div>

                  <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl" style={{ overflowWrap: 'anywhere' }}>
                    {restaurant.name}
                  </h1>

                  <p className="mt-4 max-w-2xl text-base leading-7 text-ink-muted">
                    {restaurant.address?.street
                      ? `${restaurant.address.street}, ${restaurant.address.district}`
                      : 'Plonge dans la carte, commande les plats chauds et reçois ton repas rapidement.'}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <span className="rounded-pill border border-divider bg-surface-1 px-4 py-2 text-sm text-ink">
                      {restaurant.menus?.length ? `${restaurant.menus.length} menu${restaurant.menus.length !== 1 ? 's' : ''}` : 'Menu en ligne'}
                    </span>
                    <span className="rounded-pill border border-divider bg-surface-1 px-4 py-2 text-sm text-ink">
                      {menuCount} plat{menuCount !== 1 ? 's' : ''}
                    </span>
                    <span className="rounded-pill border border-divider bg-surface-1 px-4 py-2 text-sm text-ink">
                      {deliveryInfo?.deliveryTime ? `${deliveryInfo.deliveryTime} min de livraison` : 'Livraison rapide'}
                    </span>
                  </div>
                </div>
                <div className="pointer-events-none hidden lg:block">
                  <div
                    className={`sticky top-24 rounded-card border border-divider bg-surface-1 p-4 text-sm text-ink-muted shadow-soft transition-transform duration-300 ${
                      cartPulse ? 'scale-105 border-brand' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                        <IconCart className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-ink-muted">Panier rapide</p>
                        <p className="mt-1 text-base font-semibold text-ink">{totalCartItems} article{totalCartItems !== 1 ? 's' : ''}</p>
                        <p className="text-sm tabular-nums text-ink-muted">{currentCartTotal.toLocaleString()} FCFA</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleDrawer}
                      className="btn-primary mt-4 w-full text-sm"
                    >
                      Ouvrir le panier
                    </button>
                  </div>
                </div>

                <aside className="grid gap-4">
                  <div className="rounded-card border border-divider bg-surface-1 p-6 shadow-soft">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ink-muted">Carte du restaurant</p>
                    <p className="mt-4 text-lg font-semibold text-ink">Découvrez les classiques et les coups de cœur du chef.</p>
                    <dl className="mt-6 grid gap-3 text-sm text-ink-muted">
                      <div className="rounded-pill border border-divider bg-canvas px-4 py-3">
                        <dt>Service</dt>
                        <dd className="mt-1 font-semibold text-ink">Livraison & retrait</dd>
                      </div>
                      <div className="rounded-pill border border-divider bg-canvas px-4 py-3">
                        <dt>Budget moyen</dt>
                        <dd className="mt-1 font-semibold text-ink">{deliveryInfo?.deliveryFee ? `${(deliveryInfo.deliveryFee + 2000).toLocaleString()} FCFA` : '1200 FCFA'}</dd>
                      </div>
                    </dl>
                  </div>

                  <div
                    className={`rounded-card border border-divider bg-surface-1 p-6 shadow-soft transition-transform duration-300 ${
                      cartPulse ? 'scale-105 border-brand' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-ink-muted">Panier</p>
                        <p className="mt-1 text-lg font-semibold text-ink">{totalCartItems} article{totalCartItems !== 1 ? 's' : ''}</p>
                      </div>
                      <span className="rounded-pill bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">Prêt</span>
                    </div>
                    <Link href="/cart" className="btn-primary mt-6 w-full text-sm">
                      Voir le panier
                    </Link>
                  </div>
                </aside>
              </div>

              {restaurant.image ? (
                <div className="overflow-hidden rounded-card border border-divider bg-surface-1 shadow-soft">
                  <div className="relative h-72 sm:h-80">
                    <Image
                      src={restaurant.image}
                      alt={`Photo du restaurant ${restaurant.name}`}
                      fill
                      sizes="100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-canvas/95 to-transparent" />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="py-10 lg:py-14">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          {loading || error ? null : restaurant ? (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="min-w-0 space-y-8">
                {categoryGroups.length > 0 ? (
                  <div className="sticky top-20 z-10 -mx-1 flex flex-wrap gap-2 border-b border-divider bg-canvas/95 py-3 backdrop-blur-sm">
                    {categoryGroups.map((group) => (
                      <a
                        key={group.category}
                        href={`#${slugifyCategory(group.category)}`}
                        className="whitespace-nowrap rounded-pill border border-divider bg-surface-1 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-brand hover:text-brand"
                      >
                        {group.category}
                      </a>
                    ))}
                  </div>
                ) : null}

                <div className="space-y-10">
                  {categoryGroups.map((group) => (
                    <section key={group.category} id={slugifyCategory(group.category)} className="scroll-mt-28">
                      <div className="mb-4 flex items-baseline justify-between gap-4">
                        <h2 className="font-display text-2xl font-semibold text-ink">{group.category}</h2>
                        <span className="shrink-0 text-sm tabular-nums text-ink-muted">
                          {group.dishes.length} plat{group.dishes.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <ul className="divide-y divide-divider border-y border-divider">
                        {group.dishes.map((dish) => (
                          <li
                            key={dish._id ?? `${dish.name}-${dish.price}`}
                            className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0 space-y-2">
                              {dish.image ? (
                                <div className="mb-3 overflow-hidden rounded-card border border-divider bg-surface-1">
                                  <div className="relative h-32 w-full overflow-hidden rounded-card">
                                    <Image
                                      src={dish.image}
                                      alt={`Photo de ${dish.name}`}
                                      fill
                                      sizes="(max-width: 640px) 100vw, 320px"
                                      className="object-cover"
                                    />
                                  </div>
                                </div>
                              ) : null}
                              <h3 className="text-lg font-semibold text-ink">{dish.name}</h3>
                              {dish.description ? (
                                <p className="text-base leading-6 text-ink-muted">{dish.description}</p>
                              ) : null}
                              {dish.preparationTime ? (
                                <p className="text-xs tabular-nums text-ink-muted">
                                  {dish.preparationTime} min de préparation
                                </p>
                              ) : null}
                            </div>

                            <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                              <span className="text-lg font-semibold tabular-nums text-ink">
                                {dish.price.toLocaleString()}{' '}
                                <span className="font-mono text-sm">{dish.currency || 'FCFA'}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddToCart(dish)}
                                disabled={!dish.isAvailable}
                                className={`btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm transition-transform duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
                                  justAddedDishId === dish._id ? 'scale-105' : ''
                                }`}
                              >
                                {dish.isAvailable === false ? (
                                  'Indisponible'
                                ) : justAddedDishId === dish._id ? (
                                  <>
                                    <IconCheck className="h-4 w-4" />
                                    Ajouté
                                  </>
                                ) : (
                                  'Ajouter'
                                )}
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </div>

              <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                <div className="surface-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-ink">Panier</h2>
                      <p className="text-sm text-ink-muted">{totalCartItems} article{totalCartItems !== 1 ? 's' : ''}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleDrawer}
                      className="rounded-pill border border-divider bg-surface-1 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-surface-2"
                    >
                      Voir le panier
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-ink-muted">Revoyez votre sélection avant de commander.</p>
                </div>
                {addedItemMessage ? (
                  <p className="rounded-card border border-brand/30 bg-soft px-4 py-3 text-sm font-medium text-brand">
                    {addedItemMessage}
                  </p>
                ) : null}
              </aside>
            </div>
          ) : (
            <div className="surface-card p-12 text-center text-ink-muted">Restaurant introuvable.</div>
          )}
        </div>
      </section>

      <div
        className={`fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-divider bg-canvas/95 px-4 py-3 shadow-soft backdrop-blur-sm transition-transform duration-300 lg:hidden ${
          cartPulse ? 'scale-105' : ''
        }`}
      >
        <div>
          <p className="text-sm font-semibold text-ink">{totalCartItems} article{totalCartItems !== 1 ? 's' : ''}</p>
          <p className="text-sm tabular-nums text-ink-muted">{currentCartTotal.toLocaleString()} FCFA</p>
        </div>
        <button
          type="button"
          onClick={handleToggleDrawer}
          className="inline-flex items-center gap-2 rounded-pill bg-brand px-4 py-3 text-sm font-semibold text-brand-ink"
        >
          Ouvrir le panier
        </button>
      </div>

      <CartDrawer
        cartItems={cartItems}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onViewCart={handleViewCart}
        onUpdateQuantity={(dishId, quantity) => {
          const updated = cartItems.map((item) =>
            item.dishId === dishId ? { ...item, quantity: Math.max(0, quantity) } : item
          );
          const filtered = updated.filter((item) => item.quantity > 0);
          setCartItems(filtered);
          saveCart(filtered);
        }}
        onRemoveItem={(dishId) => {
          const filtered = cartItems.filter((item) => item.dishId !== dishId);
          setCartItems(filtered);
          saveCart(filtered);
        }}
      />

      {pendingDish ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-card border border-divider bg-canvas p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-ink">Remplacer le panier ?</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Votre panier contient déjà des plats d&apos;un autre restaurant. Ajouter « {pendingDish.name} » videra votre panier actuel.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={handleCancelReplaceCart} className="btn-secondary px-4 py-2.5 text-sm">
                Annuler
              </button>
              <button type="button" onClick={handleConfirmReplaceCart} className="btn-primary px-4 py-2.5 text-sm">
                Remplacer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
