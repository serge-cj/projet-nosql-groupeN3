'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { io, type Socket } from 'socket.io-client';
import api from '@/lib/api';
import LiveStatsBadge from './LiveStatsBadge';
import { IconCheck, IconPlate } from './icons';

type OrderStatus =
  | 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY_FOR_DELIVERY'
  | 'DELIVERY_IN_PROGRESS' | 'DELIVERED' | 'CANCELLED' | 'FAILED';

interface MyOrder {
  _id: string;
  status: OrderStatus;
}

const ACTIVE_STATUSES: OrderStatus[] = [
  'PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_DELIVERY', 'DELIVERY_IN_PROGRESS',
];

// Nous regroupons les statuts détaillés en 3 grandes étapes lisibles côté client.
const STEPS = [
  { key: 'preparing', label: 'Préparation', statuses: ['PENDING', 'CONFIRMED', 'PREPARING'] },
  { key: 'onTheWay', label: 'En route', statuses: ['READY_FOR_DELIVERY', 'DELIVERY_IN_PROGRESS'] },
  { key: 'delivered', label: 'Livrée', statuses: ['DELIVERED'] },
] as const;

type StepState = 'done' | 'active' | 'upcoming';

function getStepIndex(status: OrderStatus): number {
  return STEPS.findIndex((step) => (step.statuses as readonly string[]).includes(status));
}

function getSocketUrl() {
  const configured = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (configured) return configured;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  return apiUrl.replace(/\/api\/?$/, '');
}

interface MyOrderStatusBadgeProps {
  variant?: 'hero' | 'compact';
}

// Nous matérialisons chaque étape par une pastille : coche pour une étape franchie,
// assiette (animée) pour l'étape en cours, point creux pour les étapes à venir.
function StepMarker({ state, variant, size }: { state: StepState; variant: 'hero' | 'compact'; size: 'sm' | 'md' }) {
  const dimension = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const filledBg = variant === 'hero' ? 'bg-mango-400 text-ink' : 'bg-brand text-brand-ink';
  const idleRing = variant === 'hero' ? 'ring-white/25 text-white/40' : 'ring-divider text-ink-muted/50';

  if (state === 'done') {
    return (
      <span className={`flex ${dimension} shrink-0 items-center justify-center rounded-full ${filledBg}`}>
        <IconCheck className={iconSize} />
      </span>
    );
  }

  if (state === 'active') {
    return (
      <span className={`relative flex ${dimension} shrink-0 items-center justify-center rounded-full ${filledBg}`}>
        <span className="absolute inset-0 rounded-full bg-current opacity-40 animate-pulse-ring" />
        <IconPlate className={`relative ${iconSize}`} />
      </span>
    );
  }

  return (
    <span className={`flex ${dimension} shrink-0 items-center justify-center rounded-full bg-transparent ring-2 ${idleRing}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
    </span>
  );
}

// Jauge verticale façon "suivi de colis" : une assiette avance le long d'une barre
// qui se remplit étape par étape, jusqu'à la livraison.
function VerticalOrderGauge({ stepIndex, variant }: { stepIndex: number; variant: 'hero' | 'compact' }) {
  const lineFilled = variant === 'hero' ? 'bg-mango-400' : 'bg-brand';
  const lineIdle = variant === 'hero' ? 'bg-white/15' : 'bg-divider';
  const labelActive = variant === 'hero' ? 'text-white' : 'text-ink';
  const labelIdle = variant === 'hero' ? 'text-white/40' : 'text-ink-muted';
  const sublabelActive = variant === 'hero' ? 'text-mango-300' : 'text-brand';

  return (
    <div className="flex flex-col">
      {STEPS.map((step, i) => {
        const state: StepState = i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'upcoming';
        const isLast = i === STEPS.length - 1;

        return (
          <div key={step.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <StepMarker state={state} variant={variant} size="md" />
              {!isLast ? (
                <span
                  className={`my-1 w-1 flex-1 rounded-pill transition-colors duration-500 ${i < stepIndex ? lineFilled : lineIdle}`}
                  style={{ minHeight: '1.75rem' }}
                />
              ) : null}
            </div>
            <div className={isLast ? '' : 'pb-5'}>
              <p
                className={`font-mono text-xs uppercase tracking-[0.16em] ${
                  state === 'upcoming' ? labelIdle : `font-semibold ${labelActive}`
                }`}
              >
                {step.label}
              </p>
              {state === 'active' ? <p className={`mt-0.5 text-[11px] ${sublabelActive}`}>En cours</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Version compacte (barre d'outils) : la même assiette qui avance, en ligne.
function HorizontalOrderGauge({ stepIndex, variant }: { stepIndex: number; variant: 'hero' | 'compact' }) {
  const lineFilled = variant === 'hero' ? 'bg-mango-400' : 'bg-brand';
  const lineIdle = variant === 'hero' ? 'bg-white/15' : 'bg-divider';

  return (
    <div className="flex items-center gap-1.5">
      {STEPS.map((step, i) => {
        const state: StepState = i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'upcoming';
        return (
          <div key={step.key} className="flex items-center gap-1.5">
            <StepMarker state={state} variant={variant} size="sm" />
            {i < STEPS.length - 1 ? (
              <span className={`h-0.5 w-5 rounded-pill ${i < stepIndex ? lineFilled : lineIdle}`} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// Nous suivons ici en direct la commande active la plus récente du client connecté
// (Préparation → En route → Livrée). À défaut de commande active, nous retombons
// sur les statistiques globales de la plateforme.
export default function MyOrderStatusBadge({ variant = 'hero' }: MyOrderStatusBadgeProps) {
  const [order, setOrder] = useState<MyOrder | null | undefined>(undefined);

  const fetchMyOrder = useCallback(async () => {
    try {
      const res = await api.get('/orders', { params: { limit: 10 } });
      const orders: MyOrder[] = res.data.orders ?? res.data ?? [];
      const active = orders.find((o) => ACTIVE_STATUSES.includes(o.status));
      setOrder(active ?? null);
    } catch {
      setOrder(null);
    }
  }, []);

  useEffect(() => {
    fetchMyOrder();

    const token = localStorage.getItem('token');
    if (!token) return undefined;

    const socket: Socket = io(getSocketUrl(), {
      auth: { token },
      transports: ['websocket'],
    });
    socket.on('order:status:updated', () => void fetchMyOrder());

    return () => {
      socket.disconnect();
    };
  }, [fetchMyOrder]);

  if (order === undefined) return null;
  if (order === null) {
    return <LiveStatsBadge variant={variant} />;
  }

  const stepIndex = getStepIndex(order.status);

  if (variant === 'compact') {
    return (
      <Link
        href={`/orders/${order._id}`}
        className="flex items-center gap-3 rounded-pill border border-divider bg-surface-1 px-4 py-2.5 transition hover:border-brand/40"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">Ma commande</span>
        <HorizontalOrderGauge stepIndex={stepIndex} variant="compact" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink">
          {STEPS[stepIndex]?.label}
        </span>
      </Link>
    );
  }

  return (
    <Link href={`/orders/${order._id}`} className="block">
      <div className="flex items-center gap-3 text-white/80">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inset-0 rounded-full bg-mango-400 animate-pulse-ring" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-mango-400" />
        </span>
        <p className="font-mono text-xs uppercase tracking-[0.34em]">Votre commande en direct</p>
      </div>
      <div className="mt-5">
        <VerticalOrderGauge stepIndex={stepIndex} variant="hero" />
      </div>
    </Link>
  );
}
