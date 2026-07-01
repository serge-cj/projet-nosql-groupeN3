import { Metadata } from 'next';
import { Suspense } from 'react';
import api from '@/lib/api';
import RestaurantDetailClient from './RestaurantDetailClient';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const response = await api.get(`/restaurants/${params.id}`);
    const restaurant = response.data.restaurant;
    return {
      title: `${restaurant.name} - Libreville Eats`,
      description: `Découvrez le menu de ${restaurant.name} et commandez en ligne à Libreville.`,
    };
  } catch {
    return {
      title: 'Restaurant - Libreville Eats',
      description: 'Découvrez nos restaurants partenaires à Libreville.',
    };
  }
}

export default function RestaurantDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-canvas p-10 text-ink-muted">Chargement…</main>}>
      <RestaurantDetailClient params={params} />
    </Suspense>
  );
}