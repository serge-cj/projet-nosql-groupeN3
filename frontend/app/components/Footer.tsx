import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-divider bg-canvas px-6 py-12 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <p className="font-display max-w-[22ch] text-[clamp(1.75rem,4.5vw,2.75rem)] leading-tight tracking-tight text-ink">
          La bonne table de Libreville, livrée chez vous.
        </p>

        <div className="flex flex-col gap-4 border-t border-divider pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="font-display text-base font-semibold text-brand">
            Libreville Eats
          </Link>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-muted">
            <Link href="/privacy" className="whitespace-nowrap transition-colors hover:text-brand">
              Confidentialité
            </Link>
            <Link href="/terms" className="whitespace-nowrap transition-colors hover:text-brand">
              Conditions
            </Link>
            <Link href="/auth/login" className="whitespace-nowrap transition-colors hover:text-brand">
              Connexion
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
