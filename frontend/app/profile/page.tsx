'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageToolbar from '../components/PageToolbar';
import api from '@/lib/api';

interface UserProfile {
  email: string;
  role: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState({ firstName: '', lastName: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    async function fetchProfile() {
      try {
        const response = await api.get('/users/profile');
        const data = response.data?.user ?? response.data;
        setUser(data);
        setProfile({
          firstName: data.profile?.firstName ?? '',
          lastName: data.profile?.lastName ?? '',
          phone: data.profile?.phone ?? '',
        });
      } catch {
        setError('Impossible de charger votre profil.');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await api.put('/users/profile', {
        profile: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
        },
      });
      setMessage('Profil mis à jour avec succès.');
    } catch {
      setError('Erreur lors de la mise à jour du profil.');
    } finally {
      setSaving(false);
    }
  }

  const roleLabel: Record<string, string> = {
    customer: 'Client',
    deliverer: 'Livreur',
    restaurant_owner: 'Restaurateur',
    admin: 'Administrateur',
  };

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <PageToolbar title="Mon profil" description="Informations personnelles et coordonnées" />

      <section className="py-10 lg:py-14">
        <div className="mx-auto max-w-2xl px-6 lg:px-10">
          {loading ? (
            <div className="surface-card p-12 text-center text-ink-muted">
              Chargement du profil...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {message && (
                <div className="rounded-card border border-brand/30 bg-brand/5 p-4 text-sm text-brand">{message}</div>
              )}
              {error && (
                <div className="rounded-card border border-error/30 bg-error/5 p-4 text-sm text-error">{error}</div>
              )}

              <div className="surface-card p-6">
                <h2 className="mb-4 font-semibold text-ink">Informations générales</h2>
                <div className="space-y-4">
                  <div>
                    <p className="mb-1 text-sm font-semibold text-ink">E-mail</p>
                    <p className="font-medium text-ink">{user?.email ?? '—'}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-semibold text-ink">Rôle</p>
                    <span className="inline-block rounded-pill bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                      {roleLabel[user?.role ?? ''] ?? user?.role ?? '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="surface-card p-6">
                <h2 className="mb-4 font-semibold text-ink">Modifier mon profil</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-ink">Prénom</span>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      className="input-field"
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-ink">Nom</span>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      className="input-field"
                    />
                  </label>
                  <label className="block space-y-2 sm:col-span-2">
                    <span className="text-sm font-semibold text-ink">Téléphone</span>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="input-field"
                      placeholder="+241XXXXXXXX"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary mt-6"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>

              <div className="text-center">
                <Link href="/orders" className="text-sm font-semibold text-brand hover:underline">
                  Voir mes commandes
                </Link>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}