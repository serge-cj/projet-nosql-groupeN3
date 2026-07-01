'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      const dashboardByRole: Record<string, string> = {
        CUSTOMER: '/',
        VENDOR: '/restaurant/dashboard',
        DELIVERER: '/deliverer/dashboard',
        ADMIN: '/admin',
      };
      router.push(dashboardByRole[response.data.user.role] ?? '/');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'E-mail ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-6 py-12">
        <div className="space-y-8">
          <div className="space-y-2">
            <Link href="/" className="font-display text-lg font-semibold text-brand">
              Libreville Eats
            </Link>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Se connecter</h1>
            <p className="text-ink-muted">Accédez à vos commandes et restaurants favoris.</p>
          </div>

          <div className="surface-card p-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-ink">E-mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="input-field"
                  placeholder="vous@exemple.ga"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-ink">Mot de passe</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </label>

              {error ? (
                <p className="rounded-input border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</p>
              ) : null}

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-ink-muted">
            Pas encore inscrit ?{' '}
            <Link href="/auth/register" className="font-semibold text-brand hover:underline">
              Créer un compte
            </Link>
          </p>
          <p className="text-center text-sm text-ink-muted">
            Vous êtes professionnel ?{' '}
            <Link href="/auth/pro" className="font-semibold text-brand hover:underline">
              Accéder à l&apos;espace pro
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
