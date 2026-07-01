import { Suspense } from 'react';
import PlatsPageClient from './PlatsPageClient';

export default function PlatsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-canvas p-10 text-ink-muted">Chargement…</main>}>
      <PlatsPageClient />
    </Suspense>
  );
}
