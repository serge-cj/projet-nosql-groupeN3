'use client';

import { useEffect, useState } from 'react';
import LiveStatsBadge, { type LiveStats } from './LiveStatsBadge';
import MyOrderStatusBadge from './MyOrderStatusBadge';

interface HomeLiveBadgeProps {
  initialStats: LiveStats;
}

// Nous adaptons ici le badge "en direct" de l'accueil selon qui est connecté :
// un client voit l'état de sa propre commande, un vendeur/livreur voit les
// statistiques globales de la plateforme, et un visiteur non connecté ne voit
// rien (pas de commande personnelle à afficher).
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

  const content =
    role.toUpperCase() === 'CUSTOMER' ? (
      <MyOrderStatusBadge variant="hero" />
    ) : (
      <LiveStatsBadge initialStats={initialStats} variant="hero" />
    );

  return (
    <div
      className="animate-fade-in-up rounded-[2rem] border border-white/10 bg-black/60 px-8 py-10 shadow-[0_35px_90px_rgba(0,0,0,0.32)] backdrop-blur-xl"
      style={{ animationDelay: '40ms' }}
    >
      {content}
    </div>
  );
}
