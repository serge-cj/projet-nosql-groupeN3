# Plan d'implémentation : Espace pro / authentification rôles professionnels

## Objectif

Implémenter le chemin public `Espace pro` dans le header et le menu mobile, puis créer :
- une page de sélection de rôle `/auth/pro`
- une inscription restaurateur `/auth/register/vendor`
- une inscription coursier `/auth/register/deliverer`

Ce flux doit rester distinct du flux client existant (`/auth/register`, `/auth/login`) et utiliser les rôles backend déjà pris en charge.

## Contexte

- Le backend accepte déjà `role` et `profile` sur `/auth/register`.
- Le modèle `User` supporte les rôles `CUSTOMER`, `VENDOR`, `DELIVERER`, `ADMIN`.
- Le header actuel affiche les liens restaurant/delivery uniquement après authentification.
- L’objectif est de rendre `Espace pro` visible même pour les visiteurs non connectés.

## Détails de l’implémentation

### 1. Header / navigation

Fichier ciblé : `frontend/app/components/Header.tsx`

Modifications :
- Ajouter un lien `Espace pro` public visible pour les visiteurs non connectés et authentifiés.
- Ce lien doit aller vers `/auth/pro`.
- Sur desktop, placer le lien dans la zone de navigation secondaire.
- Sur mobile, garder le lien dans les actions visibles ou le menu du header.
- Ne pas remplacer les liens `Connexion` / `Inscription` existants pour les clients.

### 2. Page de sélection de rôle

Nouveau fichier : `frontend/app/auth/pro/page.tsx`

Contenu :
- Deux cartes de rôle : Restaurateur et Coursier.
- Chaque carte affiche : titre, description, CTA clair.
- CTA Restaurateur → `/auth/register/vendor`
- CTA Coursier → `/auth/register/deliverer`
- Explication brève du rôle pour éviter toute confusion.
- Bouton retour / lien vers inscription client possible, mais pas nécessaire.

### 3. Formulaire de création de compte restaurateur

Nouveau fichier : `frontend/app/auth/register/vendor/page.tsx`

Champs :
- Email
- Mot de passe
- Prénom
- Nom
- Téléphone
- Nom du restaurant
- Adresse du restaurant
- Zone de livraison

Comportement :
- Validation front-end simple sur les champs requis.
- Envoi vers `POST /api/auth/register` ou `/auth/register` avec `role: 'VENDOR'`.
- Mettre les infos additionnelles dans `profile` et `restaurantProfile` ou `profile.vendor` selon la structure front-end.
- Après réussite, stocker `token` et `user` puis rediriger vers `/restaurant/dashboard`.

### 4. Formulaire de création de compte coursier

Nouveau fichier : `frontend/app/auth/register/deliverer/page.tsx`

Champs :
- Email
- Mot de passe
- Prénom
- Nom
- Téléphone
- Type de véhicule
- Zone de livraison

Comportement :
- Validation front-end simple.
- Envoi vers `POST /api/auth/register` avec `role: 'DELIVERER'`.
- Mettre les infos spécifiques dans `profile` ou `profile.deliverer`.
- Après réussite, stocker `token` et `user` puis rediriger vers `/deliverer/dashboard`.

### 5. Adaptations backend / données

Vérification nécessaire :
- Le backend accepte `profile` et `role` sur l’inscription.
- Le schéma `authValidators.js` valide déjà `role: z.enum(['CUSTOMER', 'VENDOR', 'DELIVERER']).optional()`.
- Les champs additionnels non présents dans `profile` peuvent être transmis mais ne seront pas validés côté backend : il faut établir un format minimal.

Approche recommandée :
- Envoyer `profile` avec les champs standard (`firstName`, `lastName`, `phone`).
- Inclure un sous-objet `profile.extra` ou `profile.vendor` / `profile.deliverer` pour les champs pro.
- Exemple :
  - Restaurateur : `profile.extra = { restaurantName, restaurantAddress, deliveryZone }`
  - Coursier : `profile.extra = { vehicleType, deliveryZone }`

### 6. Redirections après inscription

- Restaurateur : rediriger vers `/restaurant/dashboard`.
- Coursier : rediriger vers `/deliverer/dashboard`.
- Enregistrer le `token` et la `user` en localStorage comme le flow client existant.

### 7. Mise à jour des pages existantes de connexion/inscription

Fichiers :
- `frontend/app/auth/login/page.tsx`
- `frontend/app/auth/register/page.tsx`

Modification mineure :
- Ajouter un lien secondaire vers `/auth/pro` depuis l’écran d’inscription ou de connexion (optionnel mais utile).
- Ne pas changer le comportement client actuel.

### 8. Tests / validation

À créer ou vérifier :
- Vérifier que `/auth/pro`, `/auth/register/vendor`, `/auth/register/deliverer` s’affichent sans erreur.
- Vérifier que le lien `Espace pro` apparaît dans `Header.tsx` lorsque l’utilisateur est déconnecté.
- Valider que la requête d’inscription envoie bien `role: VENDOR` ou `role: DELIVERER`.
- Valider la redirection vers les dashboards pro respectifs.

## Ordre d’exécution

1. Mettre à jour `Header.tsx` pour exposer `Espace pro`.
2. Créer `frontend/app/auth/pro/page.tsx`.
3. Créer `frontend/app/auth/register/vendor/page.tsx`.
4. Créer `frontend/app/auth/register/deliverer/page.tsx`.
5. Ajouter un lien secondaire vers `/auth/pro` sur les pages de login/register existantes.
6. Tester manuellement le parcours public → rôle → inscription.
7. Ajuster si nécessaire le format `profile` envoyé au backend.

## Fichiers à ajouter / modifier

- `frontend/app/components/Header.tsx` (modifier)
- `frontend/app/auth/pro/page.tsx` (ajouter)
- `frontend/app/auth/register/vendor/page.tsx` (ajouter)
- `frontend/app/auth/register/deliverer/page.tsx` (ajouter)
- `frontend/app/auth/login/page.tsx` (modifier optionnel)
- `frontend/app/auth/register/page.tsx` (modifier optionnel)

## Remarques

- L’architecture actuelle du backend rend le rôle professionnel déjà supporté.
- Les informations métier pro peuvent rester dans un sous-objet `profile.extra` pour éviter d’altérer le modèle principal.
- Le parcours client existant reste inchangé et reste la voie par défaut pour les utilisateurs non professionnels.
