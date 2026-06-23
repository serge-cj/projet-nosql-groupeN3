'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageToolbar from '../components/PageToolbar';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { IconMinus, IconPlus, IconTrash2 } from '../components/icons';
import { groupCartByRestaurant, getCartTotal, getTotalItems, validateCartItems, type CartItem } from '@/lib/cartHelper';

const DISTRICTS = ['Nombakélé', 'Batavéa', 'Deïdate', 'Gué-Gué', 'Okala', 'Nkembo', 'Akébé', 'Lalala', 'PK5', 'Santa-Marija'];
const PHONE_PATTERN = /^\+241\d{8}$/;

type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE_MONEY';

interface DeliveryForm {
  street: string;
  district: string;
  notes: string;
  recipientName: string;
  recipientPhone: string;
  paymentMethod: PaymentMethod;
}

function getCheckoutErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string; message?: string } } }).response;
    return response?.data?.message ?? response?.data?.error ?? 'Erreur lors du traitement de votre commande';
  }

  if (error instanceof Error) return error.message;
  return 'Erreur lors du traitement de votre commande';
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [deliveryForm, setDeliveryForm] = useState<DeliveryForm>({
    street: '',
    district: '',
    notes: '',
    recipientName: '',
    recipientPhone: '',
    paymentMethod: 'CASH',
  });

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const validated = validateCartItems(Array.isArray(parsed) ? parsed : []);
        setCartItems(validated);
      } catch {
        setCartItems([]);
      }
    }
  }, []);

  function updateQuantity(id: string, newQuantity: number) {
    if (newQuantity <= 0) {
      removeItem(id);
    } else {
      const updated = cartItems.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item));
      setCartItems(updated);
      localStorage.setItem('cart', JSON.stringify(updated));
    }
  }

  function removeItem(id: string) {
    const updated = cartItems.filter((item) => item.id !== id);
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  }

  const subtotal = getCartTotal(cartItems);
  const deliveryFee = subtotal > 20000 ? 0 : 1000;
  const tax = Math.round(subtotal * 0.12);
  const total = subtotal + deliveryFee + tax;
  const restaurantGroups = groupCartByRestaurant(cartItems);
  const hasMultipleRestaurants = restaurantGroups.length > 1;

  function updateDeliveryForm(field: keyof DeliveryForm, value: string) {
    setDeliveryForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCheckoutError('');

    if (!PHONE_PATTERN.test(deliveryForm.recipientPhone)) {
      setCheckoutError('Le téléphone doit respecter le format +241XXXXXXXX.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setCheckoutError('Connectez-vous avant de passer commande.');
      return;
    }

    setLoading(true);
    const createdOrderIds: string[] = [];

    try {
      for (const group of restaurantGroups) {
        const response = await api.post('/orders', {
          restaurantId: group.restaurantId,
          deliveryInfo: {
            address: {
              street: deliveryForm.street,
              district: deliveryForm.district,
              city: 'Libreville',
              ...(deliveryForm.notes.trim() && { notes: deliveryForm.notes.trim() }),
            },
            recipientName: deliveryForm.recipientName,
            recipientPhone: deliveryForm.recipientPhone,
          },
          paymentMethod: deliveryForm.paymentMethod,
          items: group.items.map((item) => ({
            dishId: item.dishId,
            dishName: item.dishName,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
          })),
        });

        const orderId = response.data?.order?._id;
        if (!orderId) {
          throw new Error(`Commande chez ${group.restaurantName} créée sans identifiant.`);
        }

        createdOrderIds.push(orderId);
      }

      localStorage.removeItem('cart');
      setCartItems([]);

      if (createdOrderIds.length === 1) {
        router.push(`/orders/${createdOrderIds[0]}`);
      } else {
        router.push(`/orders?ids=${createdOrderIds.join(',')}`);
      }
    } catch (error) {
      setCheckoutError(getCheckoutErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <PageToolbar title="Votre commande" description="Panier et livraison" />

      <section className="py-10 lg:py-14">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          {cartItems.length === 0 ? (
            <div className="surface-card p-12 text-center">
              <div className="mb-4 text-4xl font-display font-semibold text-ink">Panier</div>
              <p className="text-ink-muted mb-6">Commencez par explorer les restaurants et ajouter des articles à votre panier.</p>
              <Link href="/restaurants" className="btn-primary">
                Découvrir les restaurants
              </Link>
            </div>
          ) : (
            <form className="grid gap-8 lg:grid-cols-3" onSubmit={handleCheckout}>
              {/* Items and delivery */}
              <div className="lg:col-span-2 space-y-6">
                {hasMultipleRestaurants && (
                  <div className="surface-card border border-brand/30 bg-soft p-4 text-sm text-brand">
                    <p className="font-semibold">Votre panier contient {restaurantGroups.length} restaurants</p>
                    <p className="mt-1">Vous recevrez {restaurantGroups.length} commande{restaurantGroups.length > 1 ? 's' : ''} indépendante{restaurantGroups.length > 1 ? 's' : ''}.</p>
                  </div>
                )}

                {restaurantGroups.map((group) => (
                  <div key={group.restaurantId} className="space-y-4">
                    <div className="surface-card p-5">
                      <h3 className="font-semibold text-ink">Commande chez <span className="text-brand">{group.restaurantName}</span></h3>
                      <p className="mt-1 text-sm text-ink-muted">{group.itemCount} article{group.itemCount !== 1 ? 's' : ''} · {group.subtotal.toLocaleString()} FCFA</p>
                    </div>

                    {group.items.map((item) => (
                      <div key={item.id} className="surface-card p-6">
                        <div className="flex gap-4">
                          <div className="h-24 w-24 shrink-0 rounded-card bg-gradient-to-br from-soft to-surface-2" />

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-ink">{item.dishName}</h4>
                            <p className="mt-1 text-sm text-ink-muted">{item.unitPrice.toLocaleString()} FCFA</p>

                            <div className="mt-3 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="flex h-11 w-11 items-center justify-center rounded-pill border border-divider text-ink-muted transition-colors hover:bg-surface-1 hover:text-ink"
                                aria-label="Retirer un"
                              >
                                <IconMinus className="h-4 w-4" />
                              </button>
                              <span className="min-w-[2.75rem] text-center font-semibold tabular-nums text-ink">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="flex h-11 w-11 items-center justify-center rounded-pill border border-divider text-ink-muted transition-colors hover:bg-surface-1 hover:text-ink"
                                aria-label="Ajouter un"
                              >
                                <IconPlus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-col items-end justify-between">
                            <p className="font-semibold tabular-nums text-ink">{(item.unitPrice * item.quantity).toLocaleString()} FCFA</p>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="flex items-center gap-1 text-sm font-medium text-error transition-colors hover:text-error"
                              aria-label="Supprimer"
                            >
                              <IconTrash2 className="h-4 w-4" />
                              <span className="hidden sm:inline">Supprimer</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                <div className="surface-card p-6">
                  <h2 className="font-semibold text-ink">Livraison</h2>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="text-sm font-semibold text-ink">Destinataire</span>
                      <input
                        type="text"
                        value={deliveryForm.recipientName}
                        onChange={(event) => updateDeliveryForm('recipientName', event.target.value)}
                        className="input-field"
                        required
                      />
                    </label>

                    <label className="block space-y-2">
                      <span className="text-sm font-semibold text-ink">Téléphone</span>
                      <input
                        type="tel"
                        value={deliveryForm.recipientPhone}
                        onChange={(event) => updateDeliveryForm('recipientPhone', event.target.value)}
                        className="input-field"
                        placeholder="+24170123456"
                        pattern="\+241[0-9]{8}"
                        required
                      />
                    </label>

                    <label className="block space-y-2">
                      <span className="text-sm font-semibold text-ink">Rue</span>
                      <input
                        type="text"
                        value={deliveryForm.street}
                        onChange={(event) => updateDeliveryForm('street', event.target.value)}
                        className="input-field"
                        required
                      />
                    </label>

                    <label className="block space-y-2">
                      <span className="text-sm font-semibold text-ink">Quartier</span>
                      <select
                        value={deliveryForm.district}
                        onChange={(event) => updateDeliveryForm('district', event.target.value)}
                        className="input-field"
                        required
                      >
                        <option value="">Choisir un quartier</option>
                        {DISTRICTS.map((district) => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block space-y-2 sm:col-span-2">
                      <span className="text-sm font-semibold text-ink">Instructions</span>
                      <textarea
                        value={deliveryForm.notes}
                        onChange={(event) => updateDeliveryForm('notes', event.target.value)}
                        className="input-field min-h-24"
                        placeholder="Étage, repère, consigne au livreur..."
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="lg:col-span-1">
                <div className="surface-card space-y-4 p-6 lg:sticky lg:top-24">
                  <h2 className="font-semibold text-ink">Récapitulatif</h2>

                  <div className="space-y-3 border-t border-divider pt-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Sous-total</span>
                      <span className="font-semibold tabular-nums text-ink">{subtotal.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Livraison estimée</span>
                      <span className="font-semibold tabular-nums text-ink">{deliveryFee === 0 ? 'Gratuite' : `${deliveryFee.toLocaleString()} FCFA`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Taxe estimée</span>
                      <span className="font-semibold tabular-nums text-ink">{tax.toLocaleString()} FCFA</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-input bg-soft p-4">
                    <span className="font-semibold text-ink">Total estimé</span>
                    <span className="text-xl font-bold tabular-nums text-brand">{total.toLocaleString()} FCFA</span>
                  </div>

                  {subtotal > 20000 && (
                    <p className="rounded-pill bg-brand-ink/10 px-4 py-2 text-center text-xs font-medium text-brand-ink">
                      Livraison gratuite estimée
                    </p>
                  )}

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-ink">Paiement</span>
                    <select
                      value={deliveryForm.paymentMethod}
                      onChange={(event) => updateDeliveryForm('paymentMethod', event.target.value as PaymentMethod)}
                      className="input-field"
                    >
                      <option value="CASH">Espèces</option>
                      <option value="MOBILE_MONEY">Mobile money</option>
                      <option value="CARD">Carte</option>
                    </select>
                  </label>

                  {checkoutError && (
                    <p className="rounded-input border border-error/30 bg-error/5 p-3 text-sm text-error">
                      {checkoutError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? 'Traitement...' : 'Passer commande'}
                  </button>

                  <Link href="/restaurants" className="block text-center text-sm font-semibold text-brand underline-offset-2 hover:underline">
                    Continuer mes achats
                  </Link>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}