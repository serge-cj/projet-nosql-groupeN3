'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const DASHBOARD_BY_ROLE: Record<string, string> = {
  VENDOR: '/restaurant/dashboard',
  DELIVERER: '/deliverer/dashboard',
};

// Un vendeur ou un livreur n'a rien à faire sur la vitrine client : seule la
// gestion de son restaurant (ou de ses livraisons) l'intéresse, donc nous le
// renvoyons directement vers son propre espace.
export default function VendorHomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const role = savedUser ? JSON.parse(savedUser)?.role : null;
      const dashboard = DASHBOARD_BY_ROLE[String(role).toUpperCase()];
      if (dashboard) {
        router.replace(dashboard);
      }
    } catch {
      // utilisateur non connecté ou donnée corrompue : on reste sur l'accueil
    }
  }, [router]);

  return null;
}
