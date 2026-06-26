'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageToolbar from '../components/PageToolbar';

export default function SettingsPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    setDarkMode(stored === 'true');
  }, []);

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    router.push('/auth/login');
  }

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <PageToolbar title="Paramètres" description="Apparence et compte" />

      <section className="py-10 lg:py-14">
        <div className="mx-auto max-w-2xl space-y-6 px-6 lg:px-10">
          <div className="surface-card p-6">
            <h2 className="mb-4 font-semibold text-ink">Apparence</h2>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-ink">Mode sombre</p>
                <p className="text-sm text-ink-muted">Activer le thème sombre pour l&apos;interface</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={darkMode}
                onClick={toggleDarkMode}
                className={`relative h-7 w-12 rounded-full transition-colors ${
                  darkMode ? 'bg-brand' : 'bg-surface-2'
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-canvas shadow transition-transform ${
                    darkMode ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </label>
          </div>

          {/* Nous affichons ici les liens relatifs au compte */}
          <div className="surface-card p-6">
            <h2 className="mb-4 font-semibold text-ink">Compte</h2>
            <div className="space-y-2">
              <Link
                href="/profile"
                className="block rounded-lg bg-surface-1 px-4 py-3 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
              >
                Modifier mon profil
              </Link>
              <Link
                href="/orders"
                className="block rounded-lg bg-surface-1 px-4 py-3 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
              >
                Mes commandes
              </Link>
            </div>
          </div>

          {/* Nous regroupons ici les actions sensibles liées à la déconnexion */}
          <div className="surface-card border-error/20 p-6">
            <h2 className="mb-4 font-semibold text-error">Déconnexion</h2>
            <p className="mb-4 text-sm text-ink-muted">Vous déconnecter de votre compte sur cet appareil.</p>
            <button
              onClick={handleLogout}
              className="rounded-pill border border-error/40 px-6 py-2 text-sm font-semibold text-error transition-colors hover:bg-error/5"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}