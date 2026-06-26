'use client';

import { useEffect, useState } from 'react';
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
  const [user, setUser] = useState<{ _id?: string; email: string; role: string } | null>(null);

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
        // Nous récupérons les commandes prêtes à être livrées ou en cours de livraison
        const response = await api.get('/orders');
        const allOrders: DeliveryOrder[] = response.data.orders ?? response.data ?? [];
        const relevant = allOrders.filter(
          (o) => o.status === 'READY_FOR_DELIVERY' || o.status === 'DELIVERY_IN_PROGRESS'
        );
        setOrders(relevant);
      } catch (err: any) {
        setError(err.response?.data?.message ?? 'Impossible de charger les livraisons.');
      } finally {
        setLoading(false);
      }
    }

    fetchDeliveries();

    const socket: Socket = io(getSocketUrl(), {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('order:status:updated', () => {
      void fetchDeliveries();
    });
    socket.on('order:deliverer:assigned', () => {
      void fetchDeliveries();
    });

    return () => {
      socket.disconnect();
    };
  }, [router]);

  async function handleAccept(orderId: string) {
    try {
      await api.post(`/orders/${orderId}/assign`, { delivererId: user?._id ?? '' });
      // Nous retirons la commande de la liste
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
    } catch {
      setError("Impossible d'accepter cette livraison.");
    }
  }

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <PageToolbar title="Espace livreur" description="Courses disponibles et livraisons en cours" />

      <section className="py-10 lg:py-14">
        <div className="mx-auto max-w-4xl px-6 lg:px-10">
          {error && (
            <div className="mb-6 rounded-card border border-error/30 bg-error/5 p-4 text-sm text-error">{error}</div>
          )}

          {loading ? (
            <div className="surface-card p-12 text-center text-ink-muted">
              Chargement des livraisons...
            </div>
          ) : orders.length === 0 ? (
            <div className="surface-card p-12 text-center">
              <p className="font-display text-xl font-semibold text-ink">Aucune course disponible</p>
              <p className="mt-2 text-ink-muted">Revenez plus tard pour voir les nouvelles livraisons.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
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
                      <button
                        onClick={() => handleAccept(order._id)}
                        className="btn-primary mt-3"
                      >
                        Accepter
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}