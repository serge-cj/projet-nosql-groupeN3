import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Nous simulons useSearchParams de next/navigation utilisé par le composant
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
}));

// Nous simulons l'appel global fetch
beforeEach(() => {
  (global as any).fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          restaurants: [],
          pagination: { page: 1, limit: 9, total: 0, totalPages: 1, hasNext: false, hasPrev: false },
        }),
    })
  );
});

afterEach(() => {
  jest.resetAllMocks();
});

it('renders discovery header, search and action buttons (visual smoke)', async () => {
  const Component = require('../app/restaurants/RestaurantsPageClient').default;
  const { container } = render(React.createElement(Component));

  expect(screen.getByText(/Restaurants à Libreville/i)).toBeInTheDocument();
  expect(screen.getByText(/Trouver vite/i)).toBeInTheDocument();

  // Nous attendons que l'appel fetch se termine et que l'interface se stabilise
  await waitFor(() => expect(screen.getByPlaceholderText(/Chercher a restaurant|Chercher un restaurant|Chercher/i)).toBeInTheDocument());

  // Nous vérifions les boutons d'action
  expect(screen.getByRole('button', { name: /Explorer/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Réinitialiser/i })).toBeInTheDocument();

  // Nous capturons un instantané pour la détection de régressions visuelles
  expect(container).toMatchSnapshot();
});
