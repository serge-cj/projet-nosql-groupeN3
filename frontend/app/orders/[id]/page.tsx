'use client';

import { useEffect, useMemo, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import api from '@/lib/api';
import { formatAmount } from '@/lib/format';

interface OrderProps {
  params: { id: string };
}

type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERY_IN_PROGRESS'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED';

interface OrderItem {
  dishId?: string;
  dishName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderAddress {
  street?: string;
  district?: string;
  city?: string;
  notes?: string;
}

interface StatusHistoryItem {
  status: OrderStatus;
  timestamp?: string;
  note?: string | null;
}

interface Order {
  _id: string;
  restaurant_id?: string | { _id?: string; name?: string };
  deliverer_id?: string | { _id?: string; personalInfo?: { firstName?: string; lastName?: string; phone?: string } } | null;
  items: OrderItem[];
  pricing?: {
    subtotal?: number;
    deliveryFee?: number;
    tax?: number;
    total?: number;
    currency?: string;
  };
  status: OrderStatus;
  statusHistory?: StatusHistoryItem[];
  deliveryInfo?: {
    address?: OrderAddress;
    recipientName?: string;
    recipientPhone?: string;
  };
  payment?: {
    method?: 'CASH' | 'CARD' | 'MOBILE_MONEY';
    status?: 'PENDING' | 'COMPLETED' | 'FAILED';
  };
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface StatusUpdatedPayload {
  orderId: string;
  status: OrderStatus;
  note?: string;
  timestamp?: string;
}

interface DelivererAssignedPayload {
  orderId: string;
  delivererId: string;
  delivererName?: string;
  delivererPhone?: string | null;
  timestamp?: string;
}

const STATUS_STEPS: Array<{ status: OrderStatus; label: string }> = [
  { status: 'PENDING', label: 'Commande reçue par le restaurant' },
  { status: 'CONFIRMED', label: 'Confirmée' },
  { status: 'PREPARING', label: 'Préparation' },
  { status: 'READY_FOR_DELIVERY', label: 'Prête pour livraison' },
  { status: 'DELIVERY_IN_PROGRESS', label: 'En route' },
  { status: 'DELIVERED', label: 'Livrée' },
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Commande reçue par le restaurant',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  READY_FOR_DELIVERY: 'Prête pour livraison',
  DELIVERY_IN_PROGRESS: 'En route',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  FAILED: 'Échouée',
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Espèces',
  CARD: 'Carte',
  MOBILE_MONEY: 'Mobile money',
};

function getSocketUrl() {
  const configuredSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (configuredSocketUrl) return configuredSocketUrl;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  return apiUrl.replace(/\/api\/?$/, '');
}

function getStoredUserId() {
  if (typeof window === 'undefined') return undefined;

  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}') as { id?: string; _id?: string };
    return user.id ?? user._id;
  } catch {
    return undefined;
  }
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string; message?: string } } }).response;
    return response?.data?.message ?? response?.data?.error ?? 'Impossible de charger la commande.';
  }

  if (error instanceof Error) return error.message;
  return 'Impossible de charger la commande.';
}

function formatMoney(value?: number, currency = 'FCFA') {
  if (typeof value !== 'number') return '—';
  return `${formatAmount(value)} ${currency}`;
}

function formatDate(value?: string) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getReferenceLabel(reference: Order['restaurant_id']) {
  if (!reference) return '—';
  if (typeof reference === 'string') return reference;
  return reference.name ?? reference._id ?? '—';
}

function getDelivererName(order: Order | null, assignedName: string) {
  if (assignedName) return assignedName;

  const deliverer = order?.deliverer_id;
  if (!deliverer) return '';
  if (typeof deliverer === 'string') return deliverer;

  const firstName = deliverer.personalInfo?.firstName;
  const lastName = deliverer.personalInfo?.lastName;
  return [firstName, lastName].filter(Boolean).join(' ') || deliverer._id || '';
}

function getDelivererPhone(order: Order | null, assignedPhone: string) {
  if (assignedPhone) return assignedPhone;

  const deliverer = order?.deliverer_id;
  if (!deliverer || typeof deliverer === 'string') return '';

  return deliverer.personalInfo?.phone ?? '';
}

export default function OrderDetailPage({ params }: OrderProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [socketStatus, setSocketStatus] = useState<'idle' | 'connected' | 'disconnected' | 'error'>('idle');
  const [assignedDelivererName, setAssignedDelivererName] = useState('');
  const [assignedDelivererPhone, setAssignedDelivererPhone] = useState('');

  useEffect(() => {
    async function fetchOrder() {
      setIsLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Connectez-vous pour suivre cette commande.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get(`/orders/${params.id}`);
        setOrder(response.data.order);
      } catch (fetchError) {
        setError(getErrorMessage(fetchError));
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrder();
  }, [params.id]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket: Socket = io(getSocketUrl(), {
      auth: {
        token,
        userId: getStoredUserId(),
      },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      setSocketStatus('connected');
      socket.emit('join:order', params.id);
    });

    socket.on('disconnect', () => {
      setSocketStatus('disconnected');
    });

    socket.on('connect_error', () => {
      setSocketStatus('error');
    });

    socket.on('order:status:updated', (payload: StatusUpdatedPayload) => {
      if (payload.orderId !== params.id) return;

      setOrder((currentOrder) => {
        if (!currentOrder) return currentOrder;

        return {
          ...currentOrder,
          status: payload.status,
          statusHistory: [
            ...(currentOrder.statusHistory ?? []),
            {
              status: payload.status,
              note: payload.note ?? null,
              timestamp: payload.timestamp ?? new Date().toISOString(),
            },
          ],
          metadata: {
            ...currentOrder.metadata,
            updatedAt: payload.timestamp ?? new Date().toISOString(),
          },
        };
      });
    });

    socket.on('order:deliverer:assigned', (payload: DelivererAssignedPayload) => {
      if (payload.orderId !== params.id) return;
      setAssignedDelivererName(payload.delivererName ?? '');
      setAssignedDelivererPhone(payload.delivererPhone ?? '');

      setOrder((currentOrder) => {
        if (!currentOrder) return currentOrder;

        return {
          ...currentOrder,
          deliverer_id: payload.delivererId,
          metadata: {
            ...currentOrder.metadata,
            updatedAt: payload.timestamp ?? new Date().toISOString(),
          },
        };
      });
    });

    return () => {
      socket.emit('leave:order', params.id);
      socket.disconnect();
    };
  }, [params.id]);

  const currentStatusIndex = useMemo(() => {
    if (!order) return 0;
    const index = STATUS_STEPS.findIndex((step) => step.status === order.status);
    return index === -1 ? 0 : index;
  }, [order]);

  const currency = order?.pricing?.currency ?? 'FCFA';
  const address = order?.deliveryInfo?.address;
  const delivererName = getDelivererName(order, assignedDelivererName);
  const delivererPhone = getDelivererPhone(order, assignedDelivererPhone);

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <section className="mx-auto max-w-5xl px-6 py-10 lg:px-10">
        {isLoading ? (
          <div className="surface-card p-8 text-center text-ink-muted">
            Chargement de la commande...
          </div>
        ) : error ? (
          <div className="rounded-card border border-error/30 bg-error/5 p-8 text-center text-error">
            {error}
          </div>
        ) : order ? (
          <>
            <div className="surface-card mb-10 p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand">Commande</p>
                  <h1 className="mt-1 text-3xl font-semibold text-ink">Suivi de commande #{order._id}</h1>
                  <p className="mt-2 text-sm text-ink-muted">Créée le {formatDate(order.createdAt ?? order.metadata?.createdAt)}</p>
                </div>
                <div className="flex flex-col items-start gap-2 md:items-end">
                  <div
                    className={`rounded-pill px-4 py-2 text-sm font-semibold ${
                      order.status === 'DELIVERED' ? 'bg-forest-100 text-forest-900' : 'bg-mango-500 text-mango-900'
                    }`}
                  >
                    {STATUS_LABELS[order.status]}
                  </div>
                  <p className="text-xs font-semibold text-ink-muted">
                    Temps réel : {socketStatus === 'connected' ? 'connecté' : socketStatus === 'error' ? 'indisponible' : 'hors ligne'}
                  </p>
                </div>
              </div>

              <div className="mt-10 space-y-6">
                {STATUS_STEPS.map((step, index) => {
                  const isCompleted = index < currentStatusIndex || order.status === 'DELIVERED';
                  const isCurrent = index === currentStatusIndex && order.status !== 'DELIVERED';

                  return (
                    <div key={step.status} className="flex items-start gap-4">
                      <div
                        className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                          isCompleted
                            ? 'bg-forest-500 text-forest-900'
                            : isCurrent
                              ? 'bg-mango-500 text-mango-900 animate-pulse-ring'
                              : 'bg-canvas text-ink-muted/40 ring-1 ring-divider'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className={`font-semibold ${isCompleted || isCurrent ? 'text-ink' : 'text-ink-muted'}`}>{step.label}</p>
                        <p className="text-sm text-ink-muted">
                          {isCompleted ? 'Terminé' : isCurrent ? 'En cours' : 'À venir'}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {(order.status === 'CANCELLED' || order.status === 'FAILED') && (
                  <div className="rounded-input border border-error/30 bg-error/5 p-4 text-sm font-semibold text-error">
                    {STATUS_LABELS[order.status]}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="surface-card p-8">
                <h2 className="mb-4 text-xl font-semibold text-ink">Détails de la commande</h2>
                <div className="space-y-4 text-ink-muted">
                  <div className="flex justify-between gap-6">
                    <span>Restaurant</span>
                    <span className="text-right font-semibold text-ink">{getReferenceLabel(order.restaurant_id)}</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span>Adresse</span>
                    <span className="text-right font-semibold text-ink">
                      {[address?.street, address?.district, address?.city].filter(Boolean).join(', ') || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span>Destinataire</span>
                    <span className="text-right font-semibold text-ink">{order.deliveryInfo?.recipientName ?? '—'}</span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span>Paiement</span>
                    <span className="text-right font-semibold text-ink">
                      {PAYMENT_LABELS[order.payment?.method ?? ''] ?? '—'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span>Total</span>
                    <span className="text-right font-semibold text-ink">{formatMoney(order.pricing?.total, currency)}</span>
                  </div>
                </div>
              </div>

              <div className="surface-card p-8">
                <h2 className="mb-4 text-xl font-semibold text-ink">Livreur</h2>
                {delivererName ? (
                  <div className="space-y-4 text-ink-muted">
                    <div>
                      <p className="font-semibold text-ink">{delivererName}</p>
                      <p className="text-sm">{delivererPhone || 'Numéro non disponible'}</p>
                    </div>
                    {delivererPhone && (
                      <a
                        href={`tel:${delivererPhone}`}
                        className="btn-primary inline-flex w-full justify-center"
                      >
                        Appeler le livreur
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-ink-muted">Aucun livreur assigné pour le moment.</p>
                )}
              </div>
            </div>

            <div className="surface-card mt-6 p-8">
              <h2 className="mb-4 text-xl font-semibold text-ink">Articles</h2>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={`${item.dishId ?? item.dishName}-${item.quantity}`} className="flex justify-between gap-6 text-sm text-ink-muted">
                    <span>
                      {item.quantity} x {item.dishName}
                    </span>
                    <span className="font-semibold text-ink">{formatMoney(item.totalPrice, currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="surface-card p-8 text-center text-ink-muted">
            Commande introuvable.
          </div>
        )}
      </section>
    </main>
  );
}
