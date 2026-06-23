# Design : Espace professionnel (restaurateur / coursier)

## Objectif

Ajouter une entrée professionnelle dédiée dans le menu principal qui ouvre un écran de choix de rôle pour les visiteurs non connectés. Ce chemin doit permettre de créer un compte restaurateur ou coursier avec des formulaires adaptés et des champs spécifiques dès l'inscription.

## Principes

- Ne pas mélanger l’accès client et l’accès pro dans le menu principal principal.
- Proposer un bouton secondaire/menu hamburger « Espace pro » visible pour tous.
- Après sélection du rôle, rediriger vers un formulaire d’inscription dédié.
- Préserver les rôles backend existants : `VENDOR` pour restaurateur, `DELIVERER` pour coursier.

## Navigation

### Header principal

- Sur desktop : zone secondaire dans le header avec un lien `Espace pro`.
- Sur mobile : ajout de l’entrée `Espace pro` dans le menu hamburger ou un bouton secondaire accessible depuis le header.
- Ce lien pointe vers `/auth/pro`.

### Page `/auth/pro`

Affichage de deux cartes côte à côte ou en colonne sur mobile :

- Carte 1 : Restaurateur
  - CTA : `Je suis restaurateur`
  - Description courte : `Gérez vos commandes et suivez vos ventes en direct.`
  - Redirige vers `/auth/register/vendor`

- Carte 2 : Coursier
  - CTA : `Je suis coursier`
  - Description courte : `Recevez des courses et suivez votre activité.`
  - Redirige vers `/auth/register/deliverer`

## Formulaires d’inscription dédiés

### `/auth/register/vendor`

Champs communs :
- Email
- Mot de passe
- Prénom
- Nom
- Téléphone

Champs spécifiques restaurateur :
- Nom du restaurant
- Adresse du restaurant
- Zone de livraison

### `/auth/register/deliverer`

Champs communs :
- Email
- Mot de passe
- Prénom
- Nom
- Téléphone

Champs spécifiques coursier :
- Type de véhicule
- Zone de livraison

## Backend

- Le backend actuel prend déjà un champ `role` sur `/auth/register`.
- Pour restaurateur, on enverra `role: 'VENDOR'`.
- Pour coursier, on enverra `role: 'DELIVERER'`.
- Les données additionnelles (`nom du restaurant`, `zone de livraison`, `type de véhicule`) peuvent être envoyées dans `profile` ou un champ dédié selon la structure du backend.

## Points d’attention

- Le lien `Espace pro` ne redirige pas vers un formulaire client.
- Il affiche un choix de rôle clair et visuel.
- Pas de lien de connexion pro sur cette page : uniquement inscription.
- On garde les formulaires clients actuels `/auth/login` et `/auth/register` tels quels.

## Validation

- Je valide le flux et la structure.
- Prochaine étape : écrire le plan d’implémentation.
