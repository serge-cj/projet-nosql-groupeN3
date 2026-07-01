import Link from 'next/link';

const exploreLinks = [
  { href: '/restaurants', label: 'Restaurants' },
  { href: '/auth/register/vendor', label: 'Devenir partenaire' },
  { href: '/auth/register/deliverer', label: 'Devenir livreur' },
];

const accountLinks = [
  { href: '/auth/login', label: 'Connexion' },
  { href: '/auth/register', label: 'Créer un compte' },
  { href: '/auth/pro', label: 'Espace pro' },
];

const legalLinks = [
  { href: '/privacy', label: 'Confidentialité' },
  { href: '/terms', label: 'Conditions' },
];

function PaymentBadge({ children, className = 'bg-canvas' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex h-8 items-center justify-center rounded-md border border-divider px-3 text-xs font-bold shadow-sm ${className}`}
    >
      {children}
    </span>
  );
}

function MastercardMark() {
  return (
    <span className="relative inline-flex h-4 w-7 items-center">
      <span className="absolute left-0 h-4 w-4 rounded-full bg-[#EB001B]" />
      <span className="absolute right-0 h-4 w-4 rounded-full bg-[#F79E1B] mix-blend-multiply" />
    </span>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-divider bg-canvas px-6 py-12 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-10">
        <p className="font-display max-w-[22ch] text-[clamp(1.75rem,4.5vw,2.75rem)] leading-tight tracking-tight text-ink">
          La bonne table de Libreville, livrée chez vous.
        </p>

        <div className="grid grid-cols-2 gap-8 border-t border-divider pt-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="font-display text-base font-semibold text-brand">
              Libreville Eats
            </Link>
            <p className="mt-2 max-w-[26ch] text-sm text-ink-muted">
              Vos restaurants préférés, livrés partout à Libreville.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink">Découvrir</p>
            <ul className="mt-3 space-y-2">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-ink-muted transition-colors hover:text-brand">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink">Compte</p>
            <ul className="mt-3 space-y-2">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-ink-muted transition-colors hover:text-brand">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink">Légal</p>
            <ul className="mt-3 space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-ink-muted transition-colors hover:text-brand">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-divider pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Paiements acceptés</p>
          <div className="flex flex-wrap items-center gap-2">
            <PaymentBadge className="bg-[#E30613] text-white">airtel money</PaymentBadge>
            <PaymentBadge className="bg-[#004990] text-white">Moov money</PaymentBadge>
            <PaymentBadge className="bg-white text-[#1A1F71]">VISA</PaymentBadge>
            <PaymentBadge className="bg-white">
              <MastercardMark />
            </PaymentBadge>
            <PaymentBadge>Espèces</PaymentBadge>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-divider pt-6 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Libreville Eats. Tous droits réservés.</p>
          <p>Projet étudiant</p>
        </div>
      </div>
    </footer>
  );
}
