'use client';

import { useCallback, useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import PageToolbar from '../../components/PageToolbar';
import LiveStatsBadge from '../../components/LiveStatsBadge';
import MenuManager from '../components/MenuManager';
import OrderManager from '../components/OrderManager';
import api from '@/lib/api';

interface RestaurantOrder {
  _id: string;
  customer_id?: { _id?: string; email?: string };
  status: string;
  pricing?: { total?: number; currency?: string };
  items?: Array<{ dishName: string; quantity: number; unitPrice?: number }>;
  deliveryInfo?: {
    address?: { street?: string; district?: string };
    recipientName?: string;
  };
  createdAt?: string;
  metadata?: { createdAt?: string; updatedAt?: string };
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
  _id?: string;
  name: string;
  description?: string;
  dishes: Dish[];
}

interface Restaurant {
  _id: string;
  name: string;
  menus?: Menu[];
}

export default function RestaurantDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<'orders' | 'menu'>('orders');
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [socketStatus, setSocketStatus] = useState<'idle' | 'connected' | 'disconnected' | 'error'>('idle');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const ordersResponse = await api.get('/orders');
      setOrders(ordersResponse.data.orders ?? ordersResponse.data ?? []);

      const restResponse = await api.get('/restaurants/me');
      if (restResponse.data.restaurants && restResponse.data.restaurants.length > 0) {
        setRestaurant(restResponse.data.restaurants[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Impossible de charger les données.');
    } finally {
      setLoading(false);
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
      if (String(parsed.role).toUpperCase() !== 'VENDOR') {
        router.push('/restaurants');
        return;
      }
    } catch {
      router.push('/auth/login');
      return;
    }

    void loadData();
  }, [loadData, router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return undefined;

    const socket: Socket = io(getSocketUrl(), {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => setSocketStatus('connected'));
    socket.on('disconnect', () => setSocketStatus('disconnected'));
    socket.on('connect_error', () => setSocketStatus('error'));

    socket.on('order:status:updated', () => {
      void loadData();
    });

    socket.on('order:deliverer:assigned', () => {
      void loadData();
    });

    return () => {
      socket.disconnect();
    };
  }, [loadData]);

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <PageToolbar
        title={restaurant?.name || 'Mon restaurant'}
        description={tab === 'orders' ? 'Commandes actives et historique' : 'Gérez vos menus et plats'}
        meta={<LiveStatsBadge variant="compact" />}
      />

      <section className="py-10 lg:py-14">
        <div className="mx-auto max-w-4xl px-6 lg:px-10">
          <div className="mb-8 flex gap-4 border-b border-divider">
            <button
              type="button"
              onClick={() => setTab('orders')}
              className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
                tab === 'orders'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              Commandes
            </button>
            <button
              type="button"
              onClick={() => setTab('menu')}
              className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${
                tab === 'menu'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              Menus & Plats
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-card border border-error/30 bg-error/5 p-4 text-sm text-error">
              {error}
            </div>
          )}

          {loading ? (
            <div className="surface-card p-12 text-center text-ink-muted">Chargement…</div>
          ) : tab === 'orders' ? (
            <OrderManager orders={orders} onUpdate={loadData} />
          ) : (
            <>
              {restaurant ? (
                <MenuManager restaurantId={restaurant._id} menus={restaurant.menus || []} onUpdate={loadData} />
              ) : (
                <div className="surface-card p-12 text-center">
                  <p className="text-ink-muted">Impossible de charger votre restaurant.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
