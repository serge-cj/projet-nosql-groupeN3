'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { IconCart, IconMoon, IconSearch, IconSun } from './icons';

interface User {
  _id: string;
  email: string;
  role: string;
}

interface CartItem {
  id: string;
  quantity: number;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('darkMode', String(next));
  }

  useEffect(() => {
    const syncUser = () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          return;
        } catch {
          localStorage.removeItem('user');
        }
      }
      setUser(null);
    };

    const syncCart = () => {
      const savedCart = localStorage.getItem('cart');
      if (!savedCart) {
        setCartCount(0);
        return;
      }
      try {
        const cart = JSON.parse(savedCart) as CartItem[];
        setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
      } catch {
        setCartCount(0);
      }
    };

    syncUser();
    syncCart();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'user' || event.key === 'token') {
        syncUser();
      }
      if (event.key === 'cart') {
        syncCart();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        router.push('/restaurants');
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/auth/login');
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    router.push(query ? `/restaurants?q=${encodeURIComponent(query)}` : '/restaurants');
  }

  const isAuthPage = pathname?.startsWith('/auth');
  if (isAuthPage) return null;

  const cartIcon = (
    <Link
      href="/cart"
      aria-label="Panier"
      className="relative inline-flex items-center rounded-pill p-3 text-ink-muted transition-colors hover:bg-surface-1 hover:text-brand"
    >
      <IconCart className="h-6 w-6" />
      {cartCount > 0 ? (
        <span className={`absolute right-0 top-0 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-pill bg-brand px-1 text-xs font-bold text-brand-ink ${cartCount > 0 ? 'animate-pulse-ring' : ''}`}>
          {cartCount}
        </span>
      ) : null}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-divider bg-canvas/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-10">
        <Link href="/" className="shrink-0 font-display text-lg font-semibold text-brand sm:text-xl">
          <span className="hidden sm:inline">Libreville Eats</span>
          <span className="sm:hidden">LE</span>
        </Link>

        <form onSubmit={handleSearchSubmit} className="hidden min-w-0 flex-1 md:block md:max-w-md lg:max-w-lg">
          <label className="relative flex items-center">
            <span className="sr-only">Chercher un restaurant</span>
            <IconSearch className="pointer-events-none absolute left-3 h-4 w-4 text-ink-muted" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Chercher un restaurant…"
              className="input-field w-full py-2.5 pl-10 pr-16 text-sm"
            />
            <kbd className="pointer-events-none absolute right-3 hidden rounded border border-divider bg-surface-1 px-1.5 py-0.5 text-[10px] font-medium text-ink-muted lg:inline">
              ⌘K
            </kbd>
          </label>
        </form>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
            className="inline-flex items-center rounded-pill p-3 text-ink-muted transition-colors hover:bg-surface-1 hover:text-brand"
          >
            {darkMode ? <IconSun className="h-5 w-5" /> : <IconMoon className="h-5 w-5" />}
          </button>

          <Link
            href="/restaurants"
            className="inline-flex items-center rounded-pill p-3 text-ink-muted transition-colors hover:bg-surface-1 hover:text-brand md:hidden"
            aria-label="Rechercher"
          >
            <IconSearch className="h-6 w-6" />
          </Link>

          <Link
            href="/restaurants"
            className={`hidden whitespace-nowrap text-sm font-medium transition-colors sm:inline ${
              pathname?.startsWith('/restaurants') ? 'text-brand' : 'text-ink-muted hover:text-brand'
            }`}
          >
            Restaurants
          </Link>

          {user?.role?.toUpperCase() === 'DELIVERER' ? (
            <Link href="/deliverer/dashboard" className={`hidden whitespace-nowrap text-sm font-medium transition-colors lg:inline ${
              pathname?.startsWith('/deliverer') ? 'text-brand' : 'text-ink-muted hover:text-brand'
            }`}>
              Livraisons
            </Link>
          ) : null}

          {user?.role?.toUpperCase() === 'VENDOR' ? (
            <Link href="/restaurant/dashboard" className={`hidden whitespace-nowrap text-sm font-medium transition-colors lg:inline ${
              pathname?.startsWith('/restaurant/dashboard') ? 'text-brand' : 'text-ink-muted hover:text-brand'
            }`}>
              Mon restaurant
            </Link>
          ) : null}

          {user ? (
            <>
              {cartIcon}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  aria-expanded={isOpen}
                  aria-haspopup="menu"
                  className="flex max-w-[9rem] items-center gap-2 rounded-pill border border-divider bg-surface-1 px-2.5 py-1.5 text-sm font-medium text-ink sm:max-w-[11rem]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-brand text-xs font-bold text-brand-ink">
                    {user.email[0].toUpperCase()}
                  </span>
                  <span className="hidden truncate sm:inline">{user.email}</span>
                </button>

                {isOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-48 rounded-card border border-divider bg-canvas shadow-card"
                  >
                    <Link
                      href="/orders"
                      role="menuitem"
                      className="block px-4 py-2.5 text-sm text-ink transition-colors hover:bg-surface-1"
                      onClick={() => setIsOpen(false)}
                    >
                      Mes commandes
                    </Link>
                    <Link
                      href="/profile"
                      role="menuitem"
                      className="block px-4 py-2.5 text-sm text-ink transition-colors hover:bg-surface-1"
                      onClick={() => setIsOpen(false)}
                    >
                      Profil
                    </Link>
                    {user.role?.toUpperCase() === 'ADMIN' ? (
                      <Link
                        href="/admin"
                        role="menuitem"
                        className="block px-4 py-2.5 text-sm text-ink transition-colors hover:bg-surface-1"
                        onClick={() => setIsOpen(false)}
                      >
                        Administration
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm text-error transition-colors hover:bg-surface-1"
                    >
                      Se déconnecter
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              {cartIcon}
              <Link href="/auth/pro" className="btn-secondary hidden px-4 py-2 text-sm sm:inline-flex">
                Espace pro
              </Link>
              <Link href="/auth/login" className="btn-secondary hidden px-4 py-2 text-sm sm:inline-flex">
                Connexion
              </Link>
              <Link href="/auth/register" className="btn-primary hidden px-4 py-2 text-sm sm:inline-flex">
                Inscription
              </Link>
              <Link href="/auth/login" className="btn-primary px-3 py-2 text-sm sm:hidden">
                Connexion
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
