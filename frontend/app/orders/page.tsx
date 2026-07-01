'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
export const dynamic = 'force-dynamic';
import PageToolbar from '../components/PageToolbar';
import { OrderCardSkeleton } from '../components/Skeleton';
import MyOrderStatusBadge from '../components/MyOrderStatusBadge';
import api from '@/lib/api';

type OrderStatus =
  | 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY_FOR_DELIVERY'
  | 'DELIVERY_IN_PROGRESS' | 'DELIVERED' | 'CANCELLED' | 'FAILED';

interface OrderSummary {
  _id: string;
  restaurant_id?: { _id?: string; name?: string };
  status: OrderStatus;
  pricing?: { total?: number; currency?: string };
  createdAt?: string;
  deliveryInfo?: { address?: { district?: string } };
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Commande reçue',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  READY_FOR_DELIVERY: 'Prête',
  DELIVERY_IN_PROGRESS: 'En route',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  FAILED: 'Échouée',
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    async function fetchOrders() {
      setLoading(true);
      try {
        // Nous vérifions si des identifiants de commandes spécifiques sont fournis via le paramètre ?ids
        const urlSearch = new URLSearchParams(window.location.search);
        const idsParam = urlSearch.get('ids');
        if (idsParam) {
          // Cas d'une validation multi-commandes : nous récupérons les commandes spécifiques par identifiant
          const orderIds = idsParam.split(',').filter(id => id.trim());
          const responses = await Promise.all(
            orderIds.map(id => api.get(`/orders/${id.trim()}`))
          );
          const fetchedOrders = responses.map(res => res.data.order ?? res.data).filter(Boolean);
          setOrders(fetchedOrders);
        } else {
          // Nous récupérons l'ensemble des commandes
          const response = await api.get('/orders');
          setOrders(response.data.orders ?? response.data ?? []);
        }
      } catch (err: any) {
        setError(err.response?.data?.message ?? 'Impossible de charger vos commandes.');
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [router]);

  function formatDate(value?: string) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }

  function getRestaurantName(order: OrderSummary) {
    if (!order.restaurant_id) return '—';
    if (typeof order.restaurant_id === 'string') return order.restaurant_id;
    return order.restaurant_id.name ?? '—';
  }

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <PageToolbar
        title="Mes commandes"
        description="Historique et suivi de vos livraisons"
        meta={<MyOrderStatusBadge variant="compact" />}
      />

      <section className="py-10 lg:py-14">
        <div className="mx-auto max-w-4xl px-6 lg:px-10">
          {loading ? (
            <div className="space-y-4" aria-label="Chargement">
              {Array.from({ length: 3 }).map((_, i) => (
                <OrderCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-card border border-error/30 bg-error/5 p-12 text-center text-error">
              {error}
            </div>
          ) : orders.length === 0 ? (
            <div className="surface-card p-12 text-center">
              <p className="font-display text-xl font-semibold text-ink">Aucune commande</p>
              <p className="mt-2 mb-6 text-ink-muted">Vous n&apos;avez pas encore passé de commande.</p>
              <Link href="/restaurants" className="btn-primary">
                Découvrir les restaurants
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Link
                  key={order._id}
                  href={`/orders/${order._id}`}
                  className="surface-card block p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{getRestaurantName(order)}</p>
                      <p className="mt-1 text-sm text-ink-muted">
                        {formatDate(order.createdAt)} · {order.deliveryInfo?.address?.district ?? 'Libreville'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`inline-block rounded-pill px-3 py-1 text-xs font-semibold ${
                        order.status === 'DELIVERED' ? 'bg-forest-100 text-forest-900' :
                        order.status === 'CANCELLED' || order.status === 'FAILED' ? 'bg-error/15 text-error' :
                        'bg-mango-100 text-mango-700'
                      }`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                      <p className="mt-2 text-sm font-semibold tabular-nums text-ink">
                        {order.pricing?.total?.toLocaleString()} {order.pricing?.currency || 'FCFA'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}