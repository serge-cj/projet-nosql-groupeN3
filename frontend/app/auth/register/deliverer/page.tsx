'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const VEHICLE_TYPES = [
  { value: 'MOTORCYCLE', label: 'Moto' },
  { value: 'SCOOTER', label: 'Scooter' },
  { value: 'BICYCLE', label: 'Vélo' },
  { value: 'CAR', label: 'Voiture' },
];

export default function DelivererRegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('MOTORCYCLE');
  const [licensePlate, setLicensePlate] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        role: 'DELIVERER',
        profile: { firstName, lastName, phone },
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Nous créons le profil livreur (véhicule, pièce d'identité) associé à ce compte
      try {
        await api.post('/deliverers', {
          idCardNumber,
          vehicleType,
          licensePlate,
        });
      } catch (e: any) {
        const message =
          e.response?.data?.error ||
          e.response?.data?.message ||
          'Impossible de créer votre profil livreur. Vérifiez les champs et réessayez.';
        setError(message);
        setLoading(false);
        return;
      }

      router.push('/deliverer/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Erreur lors de l'inscription");
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
            <h1 className="font-display text-3xl font-semibold tracking-tight">Inscription coursier</h1>
            <p className="text-ink-muted">Créez un compte pour recevoir des courses et gérer vos livraisons.</p>
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

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-ink">Numéro de carte d&apos;identité</span>
                <input
                  type="text"
                  value={idCardNumber}
                  onChange={(event) => setIdCardNumber(event.target.value)}
                  className="input-field"
                  placeholder="Numéro CNI"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-ink">Type de véhicule</span>
                <select
                  value={vehicleType}
                  onChange={(event) => setVehicleType(event.target.value)}
                  className="input-field"
                  required
                >
                  {VEHICLE_TYPES.map((vehicle) => (
                    <option key={vehicle.value} value={vehicle.value}>
                      {vehicle.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-ink">Plaque d&apos;immatriculation</span>
                <input
                  type="text"
                  value={licensePlate}
                  onChange={(event) => setLicensePlate(event.target.value)}
                  className="input-field"
                  placeholder="Plaque d'immatriculation"
                  required
                />
              </label>

              {error ? (
                <p className="rounded-input border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</p>
              ) : null}

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Inscription…' : 'Créer mon espace coursier'}
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
