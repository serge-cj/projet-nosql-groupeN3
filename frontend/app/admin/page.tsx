'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageToolbar from '../components/PageToolbar';
import api from '@/lib/api';

interface UserInfo {
  _id?: string;
  email: string;
  role: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !savedUser) {
      router.push('/auth/login');
      return;
    }
    try {
      const parsed = JSON.parse(savedUser);
      if (parsed.role !== 'admin') {
        router.push('/restaurants');
        return;
      }
    } catch {
      router.push('/auth/login');
      return;
    }

    async function fetchData() {
      try {
        const [ordersRes, restaurantsRes] = await Promise.all([
          api.get('/orders'),
          api.get('/restaurants'),
        ]);
        setUsers([]);
      } catch {
        setError('Impossible de charger les données.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <PageToolbar title="Administration" description="Gestion de la plateforme Libreville Eats" />

      <section className="py-10 lg:py-14">
        <div className="mx-auto max-w-3xl px-6 lg:px-10">
          {loading ? (
            <div className="surface-card p-12 text-center text-ink-muted">Chargement…</div>
          ) : error ? (
            <div className="rounded-card border border-error/30 bg-error/5 p-12 text-center text-error">{error}</div>
          ) : (
            <ul className="divide-y divide-divider border-y border-divider">
              <li className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-ink">Commandes</h2>
                  <p className="text-sm text-ink-muted">Gérer les commandes de la plateforme.</p>
                </div>
                <button type="button" onClick={() => router.push('/orders')} className="btn-primary whitespace-nowrap px-5 py-2 text-sm">
                  Voir les commandes
                </button>
              </li>
              <li className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-ink">Restaurants</h2>
                  <p className="text-sm text-ink-muted">Gérer les restaurants partenaires.</p>
                </div>
                <button type="button" onClick={() => router.push('/restaurants')} className="btn-primary whitespace-nowrap px-5 py-2 text-sm">
                  Voir les restaurants
                </button>
              </li>
              <li className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-ink">Livreurs</h2>
                  <p className="text-sm text-ink-muted">Gérer les livreurs enregistrés.</p>
                </div>
                <button type="button" onClick={() => router.push('/deliverer/dashboard')} className="btn-secondary whitespace-nowrap px-5 py-2 text-sm">
                  Espace livreur
                </button>
              </li>
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}