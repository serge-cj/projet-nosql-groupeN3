'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { IconCheck } from '../../../components/icons';

const VEHICLE_TYPES = [
  { value: 'MOTORCYCLE', label: 'Moto' },
  { value: 'SCOOTER', label: 'Scooter' },
  { value: 'BICYCLE', label: 'Vélo' },
  { value: 'CAR', label: 'Voiture' },
];

const benefits = [
  'Recevez des courses près de chez vous en temps réel',
  'Choisissez votre véhicule et vos horaires de travail',
  'Encaissez directement vos livraisons, sans attente',
];

export default function DelivererRegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('MOTORCYCLE');
  const [licensePlate, setLicensePlate] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setFieldErrors({});

    const phoneRegex = /^\+241\d{8}$/;
    const newFieldErrors: Record<string, string> = {};
    if (!phoneRegex.test(phone)) newFieldErrors.phone = 'Numéro invalide (ex: +24187650123)';
    if (password.length < 8) newFieldErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) newFieldErrors.email = 'E-mail invalide';
    if (!idCardNumber.trim()) newFieldErrors.idCardNumber = "Le numéro de carte d'identité est requis";
    if (!licensePlate.trim() && vehicleType !== 'BICYCLE') {
      newFieldErrors.licensePlate = "La plaque d'immatriculation est requise";
    }
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

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
      <section className="mx-auto grid max-w-5xl gap-10 px-6 py-12 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-8">
          <div className="space-y-2">
            <Link href="/auth/pro" className="font-display text-lg font-semibold text-brand hover:underline">
              ← Retour à l&apos;espace pro
            </Link>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Inscription coursier</h1>
            <p className="text-ink-muted">Créez un compte pour recevoir des courses et gérer vos livraisons.</p>
          </div>

          <div className="surface-card p-8">
            <form className="space-y-8" onSubmit={handleSubmit}>
              <fieldset className="space-y-5">
                <legend className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 text-[11px] text-brand">1</span>
                  Vos informations
                </legend>

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
                  {fieldErrors.phone ? <p className="mt-1 text-sm text-error">{fieldErrors.phone}</p> : null}
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
                  {fieldErrors.email ? <p className="mt-1 text-sm text-error">{fieldErrors.email}</p> : null}
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-ink">Mot de passe</span>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="input-field pr-16"
                      placeholder="8 caractères minimum"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-muted hover:text-brand"
                    >
                      {showPassword ? 'Masquer' : 'Afficher'}
                    </button>
                  </div>
                  {fieldErrors.password ? <p className="mt-1 text-sm text-error">{fieldErrors.password}</p> : null}
                </label>
              </fieldset>

              <fieldset className="space-y-5 border-t border-divider pt-6">
                <legend className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 text-[11px] text-brand">2</span>
                  Votre véhicule
                </legend>

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
                  {fieldErrors.idCardNumber ? (
                    <p className="mt-1 text-sm text-error">{fieldErrors.idCardNumber}</p>
                  ) : null}
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
                  />
                  {fieldErrors.licensePlate ? (
                    <p className="mt-1 text-sm text-error">{fieldErrors.licensePlate}</p>
                  ) : null}
                </label>
              </fieldset>

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

        <aside className="surface-card space-y-5 p-6 lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Pourquoi Libreville Eats ?</p>
          <ul className="space-y-3 text-sm text-ink-muted">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2.5">
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-divider pt-4 text-xs text-ink-muted">
            Vos documents (CNI, véhicule) sont uniquement utilisés pour vérifier votre identité et sécuriser les
            livraisons.
          </div>
        </aside>
      </section>
    </main>
  );
}
