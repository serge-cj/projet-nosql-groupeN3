'use client';

import { useCallback, useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import PageToolbar from '../../components/PageToolbar';
import api from '@/lib/api';

interface DeliveryOrder {
  _id: string;
  restaurant_id?: { _id?: string; name?: string };
  customer_id?: { _id?: string; email?: string };
  status: string;
  pricing?: { total?: number; currency?: string };
  deliveryInfo?: {
    address?: { street?: string; district?: string; city?: string; notes?: string };
    recipientName?: string;
    recipientPhone?: string;
  };
  items?: Array<{ dishName: string; quantity: number }>;
  createdAt?: string;
}

export default function DelivererDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingOrderId, setActingOrderId] = useState<string | null>(null);
  const [user, setUser] = useState<{ id?: string; _id?: string; email: string; role: string } | null>(null);
  const [completedDeliveries, setCompletedDeliveries] = useState(0);

  // Nous comptons ici le nombre de commandes livrées par ce livreur (pas le nombre
  // de plats), via le total de pagination renvoyé par l'API pour ce filtre.
  const fetchCompletedDeliveries = useCallback(async () => {
    try {
      const response = await api.get('/orders', { params: { status: 'DELIVERED', limit: 1 } });
      setCompletedDeliveries(response.data.pagination?.total ?? 0);
    } catch {
      // nous gardons la dernière valeur connue en cas d'échec réseau
    }
  }, []);

  function getSocketUrl() {
    const configuredSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (configuredSocketUrl) return configuredSocketUrl;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    return apiUrl.replace(/\/api\/?$/, '');
  }

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !savedUser) {
      router.push('/auth/login');
      return;
    }
    try {
      const parsed = JSON.parse(savedUser);
      if (String(parsed.role).toUpperCase() !== 'DELIVERER') {
        router.push('/restaurants');
        return;
      }
      setUser(parsed);
    } catch {
      router.push('/auth/login');
      return;
    }

    async function fetchDeliveries() {
      setLoading(true);
      try {
        // GET /orders renvoie déjà, pour un livreur, ses propres courses
        // (en attente d'acceptation ou en cours) grâce au filtre côté backend
        const response = await api.get('/orders');
        const allOrders: DeliveryOrder[] = response.data.orders ?? response.data ?? [];
        const relevant = allOrders.filter(
          (o) =>
            (o.status === 'READY_FOR_DELIVERY') ||
            (o.status === 'DELIVERY_IN_PROGRESS')
        );
        setOrders(relevant);
      } catch (err: any) {
        setError(err.response?.data?.message ?? 'Impossible de charger les livraisons.');
      } finally {
        setLoading(false);
      }
    }

    fetchDeliveries();
    void fetchCompletedDeliveries();

    const socket: Socket = io(getSocketUrl(), {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('order:status:updated', () => {
      void fetchDeliveries();
      void fetchCompletedDeliveries();
    });
    socket.on('order:deliverer:assigned', () => {
      void fetchDeliveries();
    });

    return () => {
      socket.disconnect();
    };
  }, [router, fetchCompletedDeliveries]);

  const availableOrders = orders.filter((o) => o.status === 'READY_FOR_DELIVERY');
  const inProgressOrders = orders.filter((o) => o.status === 'DELIVERY_IN_PROGRESS');

  async function handleAccept(orderId: string) {
    setActingOrderId(orderId);
    setError('');
    try {
      await api.post(`/orders/${orderId}/assign`, { delivererId: user?.id ?? user?._id ?? '' });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: 'DELIVERY_IN_PROGRESS' } : o))
      );
    } catch {
      setError("Impossible d'accepter cette livraison.");
    } finally {
      setActingOrderId(null);
    }
  }

  async function handleMarkDelivered(orderId: string) {
    setActingOrderId(orderId);
    setError('');
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'DELIVERED' });
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      void fetchCompletedDeliveries();
    } catch {
      setError('Impossible de marquer cette commande comme livrée.');
    } finally {
      setActingOrderId(null);
    }
  }

  function renderOrderCard(order: DeliveryOrder, action: 'accept' | 'deliver') {
    const isActing = actingOrderId === order._id;
    return (
      <div key={order._id} className="surface-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-semibold text-ink">
              {order.restaurant_id && typeof order.restaurant_id !== 'string'
                ? order.restaurant_id.name
                : 'Restaurant'}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              {order.deliveryInfo?.recipientName} · {order.deliveryInfo?.address?.district ?? '—'}
            </p>
            {order.items && (
              <p className="mt-2 text-sm text-ink-muted">
                {order.items.length} article{order.items.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-semibold tabular-nums text-ink">
              {order.pricing?.total?.toLocaleString()} {order.pricing?.currency || 'FCFA'}
            </p>
            {action === 'accept' ? (
              <button
                onClick={() => handleAccept(order._id)}
                className="btn-primary mt-3"
                disabled={isActing}
              >
                {isActing ? '⏳' : 'Accepter'}
              </button>
            ) : (
              <button
                onClick={() => handleMarkDelivered(order._id)}
                className="btn-primary mt-3"
                disabled={isActing}
              >
                {isActing ? '⏳' : 'Marquer comme livrée'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <PageToolbar
        title="Espace livreur"
        description="Courses disponibles et livraisons en cours"
        meta={
          <div className="flex items-center gap-x-3 rounded-pill border border-divider bg-surface-1 px-4 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inset-0 rounded-full bg-brand animate-pulse-ring" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            <span className="tabular-nums">
              <span className="font-semibold text-ink">{completedDeliveries}</span> livraison
              {completedDeliveries > 1 ? 's' : ''} effectuée{completedDeliveries > 1 ? 's' : ''}
            </span>
          </div>
        }
      />

      <section className="py-10 lg:py-14">
        <div className="mx-auto max-w-4xl px-6 lg:px-10 space-y-12">
          {error && (
            <div className="rounded-card border border-error/30 bg-error/5 p-4 text-sm text-error">{error}</div>
          )}

          {loading ? (
            <div className="surface-card p-12 text-center text-ink-muted">
              Chargement des livraisons...
            </div>
          ) : (
            <>
              <div>
                <h2 className="mb-4 font-display text-xl font-semibold text-ink">
                  Mes livraisons en cours ({inProgressOrders.length})
                </h2>
                {inProgressOrders.length === 0 ? (
                  <div className="surface-card p-8 text-center">
                    <p className="text-ink-muted">Aucune livraison en cours.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inProgressOrders.map((order) => renderOrderCard(order, 'deliver'))}
                  </div>
                )}
              </div>

              <div>
                <h2 className="mb-4 font-display text-xl font-semibold text-ink">
                  Courses disponibles ({availableOrders.length})
                </h2>
                {availableOrders.length === 0 ? (
                  <div className="surface-card p-12 text-center">
                    <p className="font-display text-xl font-semibold text-ink">Aucune course disponible</p>
                    <p className="mt-2 text-ink-muted">Revenez plus tard pour voir les nouvelles livraisons.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableOrders.map((order) => renderOrderCard(order, 'accept'))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
