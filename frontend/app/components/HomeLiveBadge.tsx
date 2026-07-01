'use client';

import { useEffect, useState } from 'react';
import LiveStatsBadge, { type LiveStats } from './LiveStatsBadge';
import MyOrderStatusBadge from './MyOrderStatusBadge';

interface HomeLiveBadgeProps {
  initialStats: LiveStats;
}

// Nous adaptons ici le badge "en direct" de l'accueil selon qui est connecté :
// un client voit l'état de sa propre commande (rien s'il n'en a pas en cours),
// un vendeur/livreur voit les statistiques globales de la plateforme, et un
// visiteur non connecté ne voit rien.
export default function HomeLiveBadge({ initialStats }: HomeLiveBadgeProps) {
  const [role, setRole] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      setRole(savedUser ? JSON.parse(savedUser)?.role ?? null : null);
    } catch {
      setRole(null);
    }
  }, []);

  if (!role) return null;

  if (role.toUpperCase() === 'CUSTOMER') {
    return <MyOrderStatusBadge variant="hero" />;
  }

  return <LiveStatsBadge initialStats={initialStats} variant="hero" />;
}
