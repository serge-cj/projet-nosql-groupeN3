# Plan d'implémentation frontend — Libreville Eats

## Objectif

Déployer une interface web légère, rapide et fidèle à la charte du projet, capable de consommer directement l'API existante et la base de données du backend. Le frontend doit gérer :
- inscription / connexion
- recherche et affichage des restaurants
- interface client et panier
- interface livreurs
- interface restaurants
- suivi de commande temps réel

Le design s'appuie sur le fichier `Design.md` : une identité visuelle centrée sur le Vert Équatorial (#00A859), un fond blanc pur, un usage très discipliné du vert et une seule motion signature.

---

## Stack recommandée

- **Next.js 14+** (App Router) : performant, léger, SEO-friendly, routes par fichier
- **React 18+**
- **Tailwind CSS** : rapidité d'implémentation, cohérence visuelle, classes utilitaires propres
- **TypeScript** : sécurité type, meilleure documentation et réutilisation
- **Socket.IO Client** : suivi de commande en temps réel
- **Axios ou Fetch native** : appels API REST
- **Zod** + **React Hook Form** : validation des formulaires et cohérence avec le backend
- **SWR** ou **React Query** : gestion cache et revalidation côté client
- **lucide-react** ou **Heroicons** : icônes légères et neutres
- **next-auth** ou JWT custom** : authentification côté frontend si besoin

---

## Principes du design

### Palette de couleurs

- `#00A859` — Vert Équatorial (couleur de marque principale)
- `#008A49` — Vert pressé / hover
- `#002B16` — Vert encre (texte sur boutons verts)
- `#FFD100` — Jaune Équateur (promotions uniquement)
- `#FFFFFF` — Toile principale (mode clair)
- `#F4F4F2` — Surface légère
- `#121212` — Toile sombre
- `#1C1C1E` / `#262629` — Surfaces sombres
- `#E0F4FF` — Bleu Estuaire (doux, touches de bannière)
- `#E2483D` — Erreur

### Typographie

- Face principale : **Inter** ou **Plus Jakarta Sans** pour les titres et le contenu
- Corps : **Inter** régulier
- Utilitaire : **IBM Plex Mono** (prix, données, badges)

### Principes visuels

- Fond blanc pur sur la version claire
- Une seule couleur de marque dominante
- Texte sur boutons verts en `#002B16`, jamais blanc
- Promotion par touches jaunes uniquement
- Interface épurée, respiration large, cartes composées
- Boutons primaires arrondis et stand-out
- Iconographie simple et fonctionnelle
- Mode sombre disponible avec les mêmes accents verts

---

## Architecture des pages

### 1. Authentification

- `/auth/login` : formulaire de connexion
- `/auth/register` : formulaire d'inscription
- Possibilité de toggle entre login et inscription
- Validation en temps réel pour le format d'e-mail, mot de passe, téléphone `+241`, etc.
- Redirections selon rôle (`CUSTOMER`, `VENDOR`, `DELIVERER`)

### 2. Page client principale

- `/` ou `/restaurants` : recherche de restaurants
- Barre de recherche + filtres : quartier, ouvert maintenant, note minimale
- `Live Order Pulse` : mini-carte de suivi en temps réel ou indicateur de commandes actives
- Cartes de restaurant avec : image de plat vedette, nom, note, quartier, distance, état d'ouverture, badge `PLUS` ou promo
- CTA visible : `Ajouter au panier` ou `Voir le menu`

### 3. Détail restaurant

- `/restaurants/[id]` : page détaillée
- En-tête restaurant avec image, nom, adresse, note et horaires
- Menu par catégorie, plats avec image, description, prix, disponibilité
- Bouton `Ajouter au panier` vert
- Panier flottant sticky sur mobile

### 4. Panier et commande

- `/cart` : panier client
- Liste détaillée des articles, contrôles quantité, retrait d'article
- Résumé prix : sous-total, frais de livraison, taxes, total
- CTA principal : `Passer commande`
- Conservation en localStorage + synchronisation API

### 5. Suivi de commande

- `/orders/[id]` : suivi détaillé
- Timeline d'état : `Commande reçue`, `Préparation`, `Prêt pour livraison`, `En route`, `Livré`
- Section livreur assigné avec info et contact
- Carte miniature si possible
- Événements horodatés

### 6. Dashboard restaurant (VENDOR)

- `/vendor` : aperçu des commandes entrantes
- Vue d'ensemble : commandes en attente, revenu du jour, livreurs disponibles
- Liste des commandes à traiter, actions : `Marquer prêt`, `Annuler`
- Gestion du menu : ajout / édition / disponibilité des plats
- Stats rapides : plats les plus commandés, temps de préparation moyen

### 7. Dashboard livreur (DELIVERER)

- `/deliverer` : espace livreur
- Courses disponibles à accepter
- Course en cours + étapes : arrivée, prise en charge, livraison
- Historique des courses
- Revenus et notes

### 8. Pages annexes

- `/profile` : gestion du profil, adresses, téléphone
- `/settings` : paramètres d'application, mode sombre
- `/404` et `/500` : pages d'erreur simples

---

## Composants et composants réutilisables

### Atomes

- `ButtonPrimary` : fond vert, texte `#002B16`, arrondi pill
- `ButtonText` : simple, texte vert
- `BadgePlus` : badge vert, texte encre
- `TagPromo` : badge jaune pour promotions
- `InputField` : champs propres, bord gris, focus vert
- `CardSurface` : shadow léger, fond blanc / sombre
- `Icon` : lucide-react

### Molécules

- `RestaurantCard`
- `DishCard`
- `CartItem`
- `OrderTimeline`
- `FilterBar`
- `StatusPill`
- `SectionHeader`
- `LivePulsePanel`

### Organismes

- `RestaurantGrid`
- `RestaurantDetailHero`
- `CartSummary`
- `VendorOrderList`
- `DelivererQueue`
- `AuthForm`

---

## Integration API

### Endpoints principaux à utiliser

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/restaurants`
- `GET /api/restaurants/nearby`
- `GET /api/restaurants/:id`
- `POST /api/orders`
- `GET /api/orders/:id`
- `GET /api/deliverers`
- `PATCH /api/restaurants/:id` (pour vendor)

### Auth et données

- Stocker token JWT dans `httpOnly cookie` ou `localStorage` selon choix de sécurité
- Charger l'utilisateur connecté via `/api/users/me` si ce endpoint existe, sinon décoder JWT
- Gérer les rôles et restrictions d'accès côté route frontend

### Données en direct

- Le frontend ne mock pas les données
- Toute donnée visible doit provenir d'un appel API réel ou d'un socket réel
- Les images et photos doivent provenir du backend / BD

### WebSocket / temps réel

- Socket.IO pour le suivi de commande
- Émettre les événements : `order.updated`, `deliverer.location`, `order.assigned`
- Consommer côté UI pour `Live Order Pulse` et `order tracking`

---

## Mise en œuvre du design

### Hero & carte d'identité

- Une page d'accueil client avec un hero minimal : titre, recherche, filtres, et un panneau de suivi réel
- Le vert `#00A859` est l'accent unique sur tous les CTA et statuts
- Les labels sur boutons verts doivent être `#002B16`
- Les promotions sont signalées uniquement en jaune `#FFD100`
- Les surfaces secondaires sont très claires (`#F4F4F2`) pour rendre la page respirante

### Interaction et état

- Hover / focus : accent plus sombre `#008A49`
- Boutons primaires pill, bordures légères uniquement si nécessaire
- Feedback d'erreur clair en rouge `#E2483D`
- Success / confirmation utilise à nouveau `#00A859`

### Mode sombre

- Activer un switch `dark mode`
- Surface sombre `#121212` + cartes `#1C1C1E` / `#262629`
- Texte principal clair `#F4F4F2`
- Accent vert conservé en mode sombre

---

## Workflow d'implémentation

1. Initialiser le projet Next.js avec TypeScript et Tailwind
2. Créer le thème de couleurs et les tokens Tailwind
3. Construire le layout global (`app/layout.tsx`, `app/globals.css`)
4. Implémenter l'authentification et la gestion de l'utilisateur
5. Construire les pages clientes principales et la navigation
6. Construire la page détail restaurant et le panier
7. Construire les dashboards vendor / deliverer
8. Intégrer Socket.IO pour le suivi temps réel
9. Ajouter tests d'intégration simples et QA visuelle
10. Finaliser la responsivité et l'accessibilité

---

## Livrables attendus

- `Next.js` app complète avec routing et roles
- Interface utilisateur fidèle au design de `Design.md`
- Toutes les données consommées en direct depuis l'API backend
- Composants réutilisables et design système léger
- Suivi de commande temps réel
- Version desktop + mobile fully responsive

---

## Notes importantes

- La priorité est de rendre visible l'API existante. Toutes les données doivent venir du backend, pas de mock.
- Les interfaces doivent rester légères et performantes.
- La signature graphique est l'usage discipliné du vert unique, avec des touches de promo jaune et un usage minimal du bleu pour les bannières.
- Le rôle utilisateur doit être géré par route et contenu affiché selon `CUSTOMER`, `VENDOR`, `DELIVERER`.

---

## Structure des dossiers proposée

```
app/
  layout.tsx
  page.tsx
  globals.css
  auth/
    login/page.tsx
    register/page.tsx
  restaurants/
    page.tsx
    [id]/page.tsx
  cart/page.tsx
  orders/[id]/page.tsx
  vendor/page.tsx
  deliverer/page.tsx
  profile/page.tsx

components/
  ui/
    ButtonPrimary.tsx
    InputField.tsx
    Badge.tsx
    Card.tsx
  restaurant/
    RestaurantCard.tsx
    RestaurantHero.tsx
    MenuCategory.tsx
  cart/
    CartItem.tsx
    CartSummary.tsx
  order/
    OrderTimeline.tsx
    OrderStatusBanner.tsx
  layout/
    Header.tsx
    Footer.tsx
    MobileTabBar.tsx
  auth/
    AuthForm.tsx
  vendor/
    VendorOrderList.tsx
  deliverer/
    DelivererQueue.tsx

lib/
  api.ts
  auth.ts
  socket.ts
  utils.ts
  hooks.ts

hooks/
  useCurrentUser.ts
  useOrders.ts
  useRestaurants.ts
  useCart.ts
  useSocket.ts

styles/
  theme.css
  utils.css
```
