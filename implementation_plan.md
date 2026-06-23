# Frontend Design & Anti-Slop Implementation Plan

## Overview

Appliquer le cahier des charges visuel de Design.md et éliminer les patterns génériques (anti-slop) sur l'ensemble des 16 pages frontend.

Le projet utilise Next.js 14, Tailwind CSS, Inter comme police principale, et une charte Vert Équatorial (#00A859). L'audit révèle plusieurs écarts par rapport au Design.md : absence de mode sombre fonctionnel, utilisation d'emoji ⭐ au lieu d'une étoile SVG brandée, absence de IBM Plex Mono pour les données financières, boutons sur fond vert utilisant `text-white` au lieu de `text-brand-ink` (#002B16), couleurs CSS hardcodées au lieu des tokens Tailwind, et plusieurs patterns visuels génériques (anti-slop). Ce plan adresse les corrections en priorité : mode sombre, typographie, icônes, tokens couleurs, puis anti-slop.

---

## Types

Aucun nouveau type n'est nécessaire ; les modifications concernent la configuration Tailwind et le CSS global.

### Modifications de configuration

- **`frontend/tailwind.config.ts`** : Ajouter `darkMode: 'class'`, ajouter `fontFamily.mono` avec IBM Plex Mono
- **`frontend/app/globals.css`** : Ajouter les variables CSS pour le mode sombre (couleurs de fond, surfaces, textes), importer IBM Plex Mono

---

## Files

Modifications portant sur 2 fichiers de configuration et 16 fichiers de pages/composants.

### Fichiers de configuration à modifier

1. **`frontend/tailwind.config.ts`**
   - Ajouter `darkMode: 'class'` dans la config racine
   - Ajouter `fontFamily.mono` : `['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular']`
   - Vérifier que toutes les couleurs du thème sont présentes (brand, promo, soft, surface)

2. **`frontend/app/globals.css`**
   - Ajouter les variables CSS mode sombre dans `.dark` :
     ```
     --color-canvas: #121212;
     --color-surface-1: #1C1C1E;
     --color-surface-2: #262629;
     --color-text-primary: #F4F4F2;
     --color-text-secondary: #9E9E9E;
     ```
   - Importer IBM Plex Mono : `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');`
   - Remplacer `background-color: #f6f8fb` par `background-color: var(--color-canvas, #f6f8fb)`

### Pages à modifier

3. **`frontend/app/layout.tsx`**
   - Ajouter script pour détecter/définir la classe `dark` sur `<html>` depuis localStorage
   - Ajouter `className` dynamique sur `<html>` basé sur le thème stocké

4. **`frontend/app/settings/page.tsx`**
   - Remplacer le toggle mode sombre factice par un vrai toggle qui :
     - Sauvegarde `darkMode` dans localStorage
     - Ajoute/enlève la classe `dark` sur `document.documentElement`
     - Persiste au rechargement

5. **`frontend/app/restaurants/page.tsx`**
   - Remplacer ⭐ emoji par une étoile SVG verte (#00A859)
   - Ajouter `dark:` sur tous les fonds, textes, bordures
   - Remplacer `text-white` par `text-brand-ink` sur les badges brand

6. **`frontend/app/restaurants/[id]/RestaurantDetailClient.tsx`**
   - Ajouter `dark:` sur tous les éléments
   - Remplacer `text-white` par `text-brand-ink` sur les boutons brand
   - Appliquer `font-mono` aux prix (unitPrice, total)

7. **`frontend/app/components/Header.tsx`**
   - Ajouter `dark:` sur tous les éléments
   - Remplacer `text-white` par `text-brand-ink` sur l'avatar user et badge panier
   - Appliquer mode sombre cohérent

8. **`frontend/app/components/Footer.tsx`**
   - Ajouter `dark:` sur fonds, textes, bordures

9. **`frontend/app/cart/page.tsx`**
   - Ajouter `dark:` sur tous les éléments
   - Remplacer `text-white` par `text-brand-ink` sur les boutons brand
   - Appliquer `font-mono` aux montants (subtotal, deliveryFee, tax, total)

10. **`frontend/app/orders/[id]/page.tsx`**
    - Ajouter `dark:` sur tous les éléments
    - Remplacer `text-white` par `text-brand-ink` sur les badges brand
    - Appliquer `font-mono` aux montants

11. **`frontend/app/orders/page.tsx`**
    - Ajouter `dark:` sur tous les éléments
    - Remplacer `text-white` par `text-brand-ink`
    - Appliquer `font-mono` aux montants

12. **`frontend/app/deliverer/dashboard/page.tsx`**
    - Ajouter `dark:` sur tous les éléments
    - Appliquer `font-mono` aux prix

13. **`frontend/app/restaurant/dashboard/page.tsx`**
    - Ajouter `dark:` sur tous les éléments
    - Appliquer `font-mono` aux prix

14. **`frontend/app/profile/page.tsx`**
    - Ajouter `dark:` sur tous les éléments
    - Remplacer `text-white` par `text-brand-ink`

15. **`frontend/app/admin/page.tsx`**
    - Ajouter `dark:` sur tous les éléments
    - Remplacer `text-white` par `text-brand-ink`

16. **`frontend/app/auth/login/page.tsx`**
    - Ajouter `dark:` sur fonds, formulaires, boutons
    - Remplacer `text-white` par `text-brand-ink` sur le bouton brand

17. **`frontend/app/auth/register/page.tsx`**
    - Mêmes corrections que login

18. **`frontend/app/page.tsx`**
    - Ajouter `dark:` sur tous les éléments
    - Remplacer `text-white` par `text-brand-ink` sur les CTA brand

### Composant SVG étoile à créer

19. **`frontend/app/components/StarRating.tsx`** (nouveau)
    - Composant réutilisable : `StarRating({ rating: number, size?: number })`
    - SVG étoile pleine Vert Équatorial #00A859
    - Gérer les demi-étoiles optionnellement

---

## Functions

Modifications ciblant principalement le JSX et les classes Tailwind — aucune fonction métier n'est modifiée.

### Nouvelles fonctions

1. **`toggleDarkMode`** dans `frontend/app/settings/page.tsx`
   - Signature : `() => void`
   - Logique : bascule la classe `dark` sur `document.documentElement`, persist dans localStorage

2. **`initTheme`** dans `frontend/app/layout.tsx`
   - Signature : lecture de `localStorage.getItem('darkMode')`
   - Logique : injecte la classe `dark` au chargement si le mode sombre était actif

### Fonctions modifiées

Aucune fonction existante n'est modifiée dans sa logique métier. Seules les classes CSS et les balises JSX changent.

---

## Classes

Aucune classe TypeScript n'est modifiée, ajoutée ou supprimée.

### Nouveau composant React

1. **`StarRating`** dans `frontend/app/components/StarRating.tsx`
   - Props : `{ rating: number; size?: number; className?: string }`
   - Rendu : SVG inline full/empty stars, couleur brand #00A859
   - Utilisé dans : `frontend/app/restaurants/page.tsx`

---

## Dependencies

Aucune nouvelle dépendance npm n'est nécessaire. Tout est réalisé avec Tailwind CSS utility classes existantes.

### Modifications de configuration uniquement

- `frontend/tailwind.config.ts` : activation darkMode + font mono
- `frontend/package.json` : inchangé

---

## Testing

Aucun nouveau test nécessaire — les modifications sont purement visuelles (classes CSS, SVG). Les tests existants (24 passants) ne sont pas impactés.

### Validation

- `npm run lint` — Doit passer sans erreur
- `npm test` — 24/24 tests doivent passer
- `npm run build` — Build doit compiler avec succès

---

## Implementation Order

Les modifications sont ordonnées par dépendance : configuration d'abord, puis layout/global, puis pages par ordre de priorité visuelle.

1. **tailwind.config.ts** — Activer darkMode + ajouter fontFamily.mono
2. **globals.css** — Ajouter variables CSS dark, importer IBM Plex Mono
3. **layout.tsx** — Script d'initialisation du thème (localStorage → class dark)
4. **settings/page.tsx** — Rendre le toggle mode sombre fonctionnel
5. **Composant StarRating.tsx** — Créer l'étoile SVG réutilisable
6. **restaurants/page.tsx** — Mode sombre + étoile SVG + font-mono prix
7. **components/Header.tsx** — Mode sombre + brand-ink au lieu de white
8. **components/Footer.tsx** — Mode sombre
9. **restaurants/[id]/RestaurantDetailClient.tsx** — Mode sombre + brand-ink + font-mono
10. **cart/page.tsx** — Mode sombre + brand-ink + font-mono
11. **orders/[id]/page.tsx** — Mode sombre + brand-ink + font-mono
12. **orders/page.tsx** — Mode sombre + brand-ink + font-mono
13. **deliverer/dashboard/page.tsx** — Mode sombre + font-mono
14. **restaurant/dashboard/page.tsx** — Mode sombre + font-mono
15. **profile/page.tsx** — Mode sombre + brand-ink
16. **admin/page.tsx** — Mode sombre + brand-ink
17. **auth/login/page.tsx** — Mode sombre + brand-ink
18. **auth/register/page.tsx** — Mode sombre + brand-ink
19. **page.tsx** (home) — Mode sombre + brand-ink + font-mono
20. **Validation finale** — `npm run lint`, `npm test`, `npm run build`