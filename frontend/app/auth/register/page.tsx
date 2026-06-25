'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface FieldError {
  [key: string]: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Validation rules
  const validateEmail = (value: string): string => {
    if (!value) return 'L\'e-mail est requis';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Format e-mail invalide';
    return '';
  };

  const validatePassword = (value: string): string => {
    if (!value) return 'Le mot de passe est requis';
    if (value.length < 8) return 'Minimum 8 caractères';
    return '';
  };

  const validateFirstName = (value: string): string => {
    if (!value) return 'Le prénom est requis';
    if (value.length < 2) return 'Minimum 2 caractères';
    return '';
  };

  const validateLastName = (value: string): string => {
    if (!value) return 'Le nom est requis';
    if (value.length < 2) return 'Minimum 2 caractères';
    return '';
  };

  const validatePhone = (value: string): string => {
    if (!value) return 'Le téléphone est requis';
    if (!/^\+241\d{8}$/.test(value)) return 'Format: +241 suivi de 8 chiffres';
    return '';
  };

  const handleFieldChange = (field: string, value: string, validator: (v: string) => string) => {
    const error = validator(value);
    setFieldErrors(prev => ({
      ...prev,
      [field]: error,
    }));
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    // Validate all fields
    const newErrors: FieldError = {
      firstName: validateFirstName(firstName),
      lastName: validateLastName(lastName),
      phone: validatePhone(phone),
      email: validateEmail(email),
      password: validatePassword(password),
    };

    setFieldErrors(newErrors);

    // Check if there are any errors
    if (Object.values(newErrors).some(err => err)) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        role: 'CUSTOMER',
        profile: {
          firstName,
          lastName,
          phone,
        },
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      router.push('/restaurants');
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
            <Link href="/" className="font-display text-lg font-semibold text-brand">
              Libreville Eats
            </Link>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Créer un compte</h1>
            <p className="text-ink-muted">Rejoignez la communauté Libreville Eats.</p>
          </div>

          <div className="surface-card p-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Prénom */}
              <label className="block space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">Prénom</span>
                  {firstName && !fieldErrors.firstName && (
                    <span className="text-xs text-success">✓ Valide</span>
                  )}
                </div>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    handleFieldChange('firstName', e.target.value, validateFirstName);
                  }}
                  onFocus={() => setFocusedField('firstName')}
                  onBlur={() => setFocusedField(null)}
                  className={`input-field transition ${
                    firstName && fieldErrors.firstName
                      ? 'border-error/50 bg-error/5'
                      : firstName && !fieldErrors.firstName
                      ? 'border-success/50 bg-success/5'
                      : ''
                  }`}
                  placeholder="Votre prénom"
                  required
                />
                {fieldErrors.firstName && (
                  <p className="text-xs text-error flex items-center gap-1">
                    <span>⚠</span> {fieldErrors.firstName}
                  </p>
                )}
                {focusedField === 'firstName' && !fieldErrors.firstName && (
                  <p className="text-xs text-ink-muted flex items-center gap-1">
                    <span>ℹ</span> Minimum 2 caractères
                  </p>
                )}
              </label>

              {/* Nom */}
              <label className="block space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">Nom</span>
                  {lastName && !fieldErrors.lastName && (
                    <span className="text-xs text-success">✓ Valide</span>
                  )}
                </div>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    handleFieldChange('lastName', e.target.value, validateLastName);
                  }}
                  onFocus={() => setFocusedField('lastName')}
                  onBlur={() => setFocusedField(null)}
                  className={`input-field transition ${
                    lastName && fieldErrors.lastName
                      ? 'border-error/50 bg-error/5'
                      : lastName && !fieldErrors.lastName
                      ? 'border-success/50 bg-success/5'
                      : ''
                  }`}
                  placeholder="Votre nom"
                  required
                />
                {fieldErrors.lastName && (
                  <p className="text-xs text-error flex items-center gap-1">
                    <span>⚠</span> {fieldErrors.lastName}
                  </p>
                )}
                {focusedField === 'lastName' && !fieldErrors.lastName && (
                  <p className="text-xs text-ink-muted flex items-center gap-1">
                    <span>ℹ</span> Minimum 2 caractères
                  </p>
                )}
              </label>

              {/* Téléphone */}
              <label className="block space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">Téléphone</span>
                  {phone && !fieldErrors.phone && (
                    <span className="text-xs text-success">✓ Valide</span>
                  )}
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    handleFieldChange('phone', e.target.value, validatePhone);
                  }}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  className={`input-field transition ${
                    phone && fieldErrors.phone
                      ? 'border-error/50 bg-error/5'
                      : phone && !fieldErrors.phone
                      ? 'border-success/50 bg-success/5'
                      : ''
                  }`}
                  placeholder="+241XXXXXXXX"
                  required
                />
                {fieldErrors.phone && (
                  <p className="text-xs text-error flex items-center gap-1">
                    <span>⚠</span> {fieldErrors.phone}
                  </p>
                )}
                {focusedField === 'phone' && !fieldErrors.phone && (
                  <p className="text-xs text-ink-muted flex items-center gap-1">
                    <span>ℹ</span> Format: +241 suivi de 8 chiffres (ex: +24106234567)
                  </p>
                )}
              </label>

              {/* E-mail */}
              <label className="block space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">E-mail</span>
                  {email && !fieldErrors.email && (
                    <span className="text-xs text-success">✓ Valide</span>
                  )}
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    handleFieldChange('email', e.target.value, validateEmail);
                  }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className={`input-field transition ${
                    email && fieldErrors.email
                      ? 'border-error/50 bg-error/5'
                      : email && !fieldErrors.email
                      ? 'border-success/50 bg-success/5'
                      : ''
                  }`}
                  placeholder="vous@exemple.ga"
                  required
                />
                {fieldErrors.email && (
                  <p className="text-xs text-error flex items-center gap-1">
                    <span>⚠</span> {fieldErrors.email}
                  </p>
                )}
                {focusedField === 'email' && !fieldErrors.email && (
                  <p className="text-xs text-ink-muted flex items-center gap-1">
                    <span>ℹ</span> Utilisez une adresse e-mail valide
                  </p>
                )}
              </label>

              {/* Mot de passe */}
              <label className="block space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">Mot de passe</span>
                  {password && !fieldErrors.password && (
                    <span className="text-xs text-success">✓ Valide</span>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    handleFieldChange('password', e.target.value, validatePassword);
                  }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className={`input-field transition ${
                    password && fieldErrors.password
                      ? 'border-error/50 bg-error/5'
                      : password && !fieldErrors.password
                      ? 'border-success/50 bg-success/5'
                      : ''
                  }`}
                  placeholder="••••••••"
                  required
                />
                {fieldErrors.password && (
                  <p className="text-xs text-error flex items-center gap-1">
                    <span>⚠</span> {fieldErrors.password}
                  </p>
                )}
                {focusedField === 'password' && !fieldErrors.password && (
                  <p className="text-xs text-ink-muted flex items-center gap-1">
                    <span>ℹ</span> Minimum 8 caractères pour votre sécurité
                  </p>
                )}
                {password && (
                  <div className="mt-2 flex gap-1">
                    {Array(Math.min(password.length, 8))
                      .fill(0)
                      .map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition ${
                            i < password.length
                              ? password.length < 8
                                ? 'bg-warning'
                                : 'bg-success'
                              : 'bg-ink/10'
                          }`}
                        />
                      ))}
                  </div>
                )}
              </label>

              {error ? (
                <p className="rounded-input border border-error/30 bg-error/5 p-3 text-sm text-error">{error}</p>
              ) : null}

              <button
                type="submit"
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || Object.values(fieldErrors).some(err => err) || !firstName || !lastName || !phone || !email || !password}
              >
                {loading ? 'Inscription…' : 'Créer un compte'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-ink-muted">
            Déjà inscrit ?{' '}
            <Link href="/auth/login" className="font-semibold text-brand hover:underline">
              Se connecter
            </Link>
          </p>
          <p className="text-center text-sm text-ink-muted">
            Vous êtes professionnel ?{' '}
            <Link href="/auth/pro" className="font-semibold text-brand hover:underline">
              Accéder à l&apos;espace pro
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
