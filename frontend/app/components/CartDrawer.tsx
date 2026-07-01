'use client';

import { IconCart, IconChevronRight, IconMinus, IconPlus, IconTrash2 } from './icons';
import type { CartItem } from '@/lib/cartHelper';
import { getCartTotal, getTotalItems } from '@/lib/cartHelper';
import { formatAmount } from '@/lib/format';

interface CartDrawerProps {
  cartItems: CartItem[];
  open: boolean;
  onClose: () => void;
  onViewCart: () => void;
  onUpdateQuantity: (dishId: string, quantity: number) => void;
  onRemoveItem: (dishId: string) => void;
}

export default function CartDrawer({
  cartItems,
  open,
  onClose,
  onViewCart,
  onUpdateQuantity,
  onRemoveItem,
}: CartDrawerProps) {
  const totalItems = getTotalItems(cartItems);
  const totalPrice = getCartTotal(cartItems);

  return (
    <div className={`fixed inset-0 z-50 pointer-events-none ${open ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
      <div
        className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden="true"
        onClick={onClose}
      />
      <section
        className={`surface-glass pointer-events-auto fixed inset-x-0 bottom-0 mx-auto flex max-w-3xl flex-col rounded-t-3xl border border-divider shadow-2xl transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        aria-modal="true"
        role="dialog"
      >
        <div className="flex items-center justify-between border-b border-divider px-6 py-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ink-muted">Panier</p>
            <p className="mt-1 text-lg font-semibold text-ink">
              {totalItems} article{totalItems !== 1 ? 's' : ''} · {formatAmount(totalPrice)} FCFA
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-divider bg-surface-1 px-3 py-2 text-sm text-ink-muted transition hover:bg-surface-2"
          >
            Fermer
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="rounded-card border border-divider bg-surface-1 p-6 text-center text-sm text-ink-muted">
              Votre panier est vide.
            </div>
          ) : (
            cartItems.map((item) => (
              <article key={item.id} className="grid gap-4 rounded-card border border-divider bg-surface-1 p-4 sm:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{item.dishName}</p>
                  <p className="mt-1 text-sm text-ink-muted">{item.restaurantName}</p>
                  <p className="mt-3 text-sm tabular-nums text-ink">{formatAmount(item.unitPrice * item.quantity)} FCFA</p>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-2 rounded-pill border border-divider bg-canvas p-1">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.dishId, item.quantity - 1)}
                      className="flex h-9 w-9 items-center justify-center text-ink-muted transition hover:bg-surface-1 hover:text-ink"
                      aria-label={`Retirer un ${item.dishName}`}
                    >
                      <IconMinus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[2.5rem] text-center font-semibold tabular-nums text-ink">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.dishId, item.quantity + 1)}
                      className="flex h-9 w-9 items-center justify-center text-ink-muted transition hover:bg-surface-1 hover:text-ink"
                      aria-label={`Ajouter un ${item.dishName}`}
                    >
                      <IconPlus className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.dishId)}
                    className="inline-flex items-center gap-2 rounded-pill border border-divider bg-transparent px-3 py-2 text-sm font-medium text-error transition hover:bg-error/5"
                  >
                    <IconTrash2 className="h-4 w-4" />
                    Supprimer
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <footer className="border-t border-divider px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-ink-muted">Total estimé</p>
              <p className="mt-1 text-xl font-semibold text-ink">{formatAmount(totalPrice)} FCFA</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-pill border border-divider bg-surface-1 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-surface-2"
              >
                Continuer
              </button>
              <button
                type="button"
                onClick={onViewCart}
                className="inline-flex items-center gap-2 rounded-pill bg-brand px-4 py-3 text-sm font-semibold text-brand-ink transition hover:bg-brand/90"
              >
                Voir le panier
                <IconChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
