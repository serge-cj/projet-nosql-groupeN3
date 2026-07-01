'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface LiveStats {
  preparing: number;
  onTheWay: number;
  delivered: number;
}

const EMPTY_STATS: LiveStats = { preparing: 0, onTheWay: 0, delivered: 0 };
const POLL_INTERVAL_MS = 30000;

interface LiveStatsBadgeProps {
  initialStats?: LiveStats;
  // Lorsque `stats` est fourni, le badge devient contrôlé : il affiche ces
  // chiffres tels quels (ex. les commandes du seul restaurant du vendeur)
  // sans jamais interroger les stats globales de la plateforme.
  stats?: LiveStats;
  variant?: 'hero' | 'compact';
}

// Nous affichons ici les compteurs globaux de la plateforme (toutes commandes confondues) :
// utilisé par défaut sur l'accueil pour les visiteurs. Les dashboards vendeur/livreur
// passent leurs propres stats via `stats` pour rester scoppés à leurs commandes.
export default function LiveStatsBadge({ initialStats, stats: controlledStats, variant = 'hero' }: LiveStatsBadgeProps) {
  const [fetchedStats, setFetchedStats] = useState<LiveStats>(initialStats ?? EMPTY_STATS);

  useEffect(() => {
    if (controlledStats) return undefined;

    let cancelled = false;

    async function fetchStats() {
      try {
        const res = await api.get('/orders/live-stats');
        if (!cancelled) setFetchedStats(res.data.stats ?? EMPTY_STATS);
      } catch {
        // nous gardons la dernière valeur connue en cas d'échec réseau
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [controlledStats]);

  const stats = controlledStats ?? fetchedStats;

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-pill border border-divider bg-surface-1 px-4 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inset-0 rounded-full bg-brand animate-pulse-ring" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
        </span>
        <span className="tabular-nums">
          <span className="font-semibold text-ink">{stats.preparing}</span> préparation
        </span>
        <span className="tabular-nums">
          <span className="font-semibold text-ink">{stats.onTheWay}</span> en route
        </span>
        <span className="tabular-nums">
          <span className="font-semibold text-ink">{stats.delivered}</span> livrées (24h)
        </span>
      </div>
    );
  }

  return (
    <div
      className="animate-fade-in-up rounded-[2rem] border border-white/10 bg-black/60 px-8 py-10 shadow-[0_35px_90px_rgba(0,0,0,0.32)] backdrop-blur-xl"
      style={{ animationDelay: '40ms' }}
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-white/80">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inset-0 rounded-full bg-mango-400 animate-pulse-ring" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-mango-400" />
          </span>
          <p className="font-mono text-xs uppercase tracking-[0.34em]">Libreville Eats · en direct</p>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs uppercase tracking-[0.18em] text-white/70">
          <span className="tabular-nums">
            <span className="font-semibold text-white">{stats.preparing}</span> en préparation
          </span>
          <span className="tabular-nums">
            <span className="font-semibold text-white">{stats.onTheWay}</span> en route
          </span>
          <span className="tabular-nums">
            <span className="font-semibold text-white">{stats.delivered}</span> livrées (24h)
          </span>
        </div>
        <span className="hidden h-px flex-1 bg-white/20 sm:block" />
      </div>
    </div>
  );
}

export type { LiveStats };
