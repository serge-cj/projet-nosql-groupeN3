import { Suspense } from 'react';
import RestaurantsPageClient from './RestaurantsPageClient';

export default function RestaurantsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-canvas p-10 text-ink-muted">Chargement…</main>}>
      <RestaurantsPageClient />
    </Suspense>
  );
}
