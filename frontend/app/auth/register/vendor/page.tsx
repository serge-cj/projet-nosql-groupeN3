'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function VendorRegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [restaurantDistrict, setRestaurantDistrict] = useState('');
  const [deliveryZone, setDeliveryZone] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);
    // Nous effectuons ici la validation côté client
    const phoneRegex = /^\+241\d{8}$/;
    const newFieldErrors: Record<string, string> = {};
    if (!phoneRegex.test(phone)) newFieldErrors.phone = 'Numéro invalide (ex: +24187650123)';
    if (password.length < 8) newFieldErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    if (!restaurantDistrict) newFieldErrors.restaurantDistrict = 'Sélectionnez un quartier';
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) newFieldErrors.email = 'E-mail invalide';
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        role: 'VENDOR',
        profile: {
          firstName,
          lastName,
          phone,
          extra: {
            restaurantName,
            restaurantAddress,
            deliveryZone,
          },
        },
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Nous créons le restaurant associé à ce commerçant lors de l'inscription
      try {
        const restResp = await api.post('/restaurants', {
          name: restaurantName,
          phone,
          address: { street: restaurantAddress, district: restaurantDistrict },
          deliveryZones: deliveryZone ? [{ zone: deliveryZone }] : [],
        });

        const createdId = restResp.data.restaurant?._id;
        if (createdId) {
          localStorage.setItem('vendor_restaurant_id', createdId);
        }
      } catch (e: any) {
        const message =
          e.response?.data?.error ||
          e.response?.data?.message ||
          'Impossible de créer votre restaurant. Vérifiez les champs et réessayez.';
        // Si le serveur renvoie des erreurs propres à certains champs, nous les associons aux champs correspondants
        if (e.response?.data?.errors && typeof e.response.data.errors === 'object') {
          setFieldErrors(e.response.data.errors);
        }
        setError(message);
        setLoading(false);
        return;
      }

      router.push('/restaurant/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.error || err.response?.data?.message || "Erreur lors de l'inscription";
      // Nous associons les éventuelles erreurs de validation aux champs correspondants
      if (err.response?.data?.errors && typeof err.response.data.errors === 'object') {
        setFieldErrors(err.response.data.errors);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-6 py-12">
        <div className="space-y-8">
          <div className="space-y-2">
            <Link href="/auth/pro" className="font-display text-lg font-semibold text-brand hover:underline">
              ← Retour à l&apos;espace pro
            </Link>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Inscription restaurateur</h1>
            <p className="text-ink-muted">Créez un compte pour gérer votre restaurant sur Libreville Eats.</p>
          </div>

          <div className="surface-card p-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-ink">Prénom</span>
                <input
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="input-field"
                  placeholder="Prénom"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-ink">Nom</span>
                <input
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="input-field"
                  placeholder="Nom"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-ink">Téléphone</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="input-field"
                  placeholder="+241XXXXXXXX"
                  required
                />
                {fieldErrors.phone ? (
                  <p className="mt-1 text-sm text-error">{fieldErrors.phone}</p>
                ) : null}
              </label>

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
                {fieldErrors.email ? (
                  <p className="mt-1 text-sm text-error">{fieldErrors.email}</p>
                ) : null}
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
                {fieldErrors.password ? (
                  <p className="mt-1 text-sm text-error">{fieldErrors.password}</p>
                ) : null}
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-ink">Nom du restaurant</span>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(event) => setRestaurantName(event.target.value)}
                  className="input-field"
                  placeholder="Nom du restaurant"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-ink">Adresse du restaurant</span>
                <input
                  type="text"
                  value={restaurantAddress}
                  onChange={(event) => setRestaurantAddress(event.target.value)}
                  className="input-field"
                  placeholder="Adresse complète"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-ink">Quartier</span>
                <select
                  value={restaurantDistrict}
                  onChange={(event) => setRestaurantDistrict(event.target.value)}
                  className="input-field"
                  required
                >
                  <option value="" disabled>
                    Sélectionnez un quartier
                  </option>
                  <option value="Nombakélé">Nombakélé</option>
                  <option value="Batavéa">Batavéa</option>
                  <option value="Deïdate">Deïdate</option>
                  <option value="Gué-Gué">Gué-Gué</option>
                  <option value="Okala">Okala</option>
                  <option value="Nkembo">Nkembo</option>
                  <option value="Akébé">Akébé</option>
                  <option value="Lalala">Lalala</option>
                  <option value="PK5">PK5</option>
                  <option value="Santa-Marija">Santa-Marija</option>
                  <option value="Nzeng Ayong">Nzeng Ayong</option>
                  <option value="Owendo">Owendo</option>
                  <option value="Akanda">Akanda</option>
                  <option value="3 Quartiers">3 Quartiers</option>
                  <option value="Glass">Glass</option>
                  <option value="Baie des Rois">Baie des Rois</option>
                  <option value="Batterie IV">Batterie IV</option>
                  <option value="Carrefour JDO">Carrefour JDO</option>
                  <option value="Centre-ville">Centre-ville</option>
                  <option value="Aéroport">Aéroport</option>
                  <option value="Montagne Sainte">Montagne Sainte</option>
                  <option value="Louis">Louis</option>
                </select>
                {fieldErrors.restaurantDistrict ? (
                  <p className="mt-1 text-sm text-error">{fieldErrors.restaurantDistrict}</p>
                ) : null}
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-ink">Zone de livraison</span>
                <input
                  type="text"
                  value={deliveryZone}
                  onChange={(event) => setDeliveryZone(event.target.value)}
                  className="input-field"
                  placeholder="Zone de livraison"
                  required
                />
              </label>

              {error ? (
                <p className="rounded-input border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</p>
              ) : null}

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Inscription…' : 'Créer mon espace restaurateur'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-ink-muted">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="font-semibold text-brand hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
