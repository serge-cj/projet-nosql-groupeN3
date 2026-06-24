# Restaurant page cart flow design

## Objectif

Rendre le parcours panier plus fluide depuis la page restaurant sans interrompre la navigation dans le menu.

L’utilisateur doit pouvoir :
- ajouter des plats depuis la page restaurant
- voir immédiatement le total et le nombre d’articles
- rouvrir le panier via un badge sticky
- aller vers `/cart` pour remplir livraison et paiement
- conserver un panier multi-restaurant tant que la validation finale se fait sur `/cart`

## Comportement attendu

### 1. Drawer latéral de panier

- Le panier s’affiche dans un drawer latéral à droite de la page restaurant.
- Le drawer est lié au contenu du panier global, pas seulement au restaurant courant.
- Le drawer peut être ouvert ou fermé par l’utilisateur.
- Lorsque l’utilisateur fait défiler ou explore d’autres catégories, le drawer se referme automatiquement.
- L’utilisateur peut rouvrir le drawer via un badge sticky visible.

### 2. Badge sticky

- Un badge sticky est affiché sur la page restaurant même si le drawer est fermé.
- Il contient au minimum :
  - un icône panier `🛒`
  - le nombre total d’articles
  - le total actuel en FCFA
- Clic sur le badge : ouvre le drawer.

### 3. Feedback d’ajout

- Lorsqu’un plat est ajouté :
  - le badge se met à jour immédiatement
  - si le drawer est ouvert, l’entrée du plat nouvellement ajouté reçoit une animation d’apparition discrète
  - aucune popup ou toast intrusif n’est affiché

### 4. Logique multi-restaurant

- Le panier peut contenir simultanément des plats de plusieurs restaurants.
- Le drawer reste un résumé unique du panier global.
- Le bouton principal du drawer s’intitule `Passer commande` et redirige vers `/cart`.
- La validation finale et la saisie des informations de livraison / paiement restent sur `/cart`.

### 5. Validation finale sur `/cart`

- `/cart` est l’écran de confirmation et de saisie :
  - résumé par restaurant
  - sous-totaux restaurant par restaurant
  - frais de livraison et taxes
  - informations de livraison et paiement
- Au moment de la validation, le système crée une commande distincte par restaurant.
- Chaque commande utilise les mêmes informations de livraison et de paiement.

## Composants et responsabilités

### `RestaurantDetailClient.tsx`

- gère l’état local du panier chargé depuis `localStorage`
- expose `isDrawerOpen` et `cartItems`
- met à jour le panier local à chaque ajout / suppression / modification de quantité
- affiche le badge sticky et ouvre / ferme le drawer
- conserve la page restaurant visible lors de l’ajout de plats

### `CartDrawer`

- nouveau composant réutilisable
- affiche :
  - liste des articles ajoutés
  - quantités modifiables
  - prix par article et sous-total
  - total global
  - bouton `Passer commande`
- prend en charge l’animation d’entrée discrète pour les nouveaux articles

### `CartPage`

- conserve la logique de saisie livraison / paiement
- traite la création de commandes séparées par restaurant au checkout
- gère les erreurs de validation de panier et de paiement

## Scénarios utilisateur

### Ajout d’un plat

1. utilisateur clique sur `Ajouter` depuis la page restaurant
2. le badge sticky passe à `🛒 3 articles • 8 000 FCFA`
3. si le drawer est ouvert, l’article apparaît avec une animation discrète
4. l’utilisateur continue de naviguer dans le menu

### Consultatation rapide du panier

1. utilisateur clique sur le badge sticky
2. le drawer s’ouvre sans recharger la page
3. l’utilisateur peut modifier les quantités ou supprimer un article
4. bouton `Passer commande` redirige vers `/cart`

### Commande multi-restaurant

1. l’utilisateur ajoute des plats de plusieurs restaurants
2. le drawer affiche bien tous les plats et le total global
3. l’utilisateur clique sur `Passer commande`
4. `/cart` montre les commandes groupées par restaurant
5. validation finale crée une commande par restaurant

## Tests à couvrir

- ouverture/fermeture du drawer sur la page restaurant
- badge sticky visible et mis à jour au bon moment
- ajout d’un plat met à jour le badge
- ajout d’un plat avec drawer ouvert déclenche animation d’entrée
- suppression et modification des quantités dans le drawer
- redirection vers `/cart` depuis le drawer
- validation finale crée plusieurs commandes si plusieurs restaurants sont présents
- gestion d’un panier vide
- gestion des erreurs de validation de livraison / paiement

## Limitations

- le drawer ne remplace pas `/cart` ; c’est un résumé rapide et un point d’entrée vers la validation finale.
- la saisie livraison / paiement reste centralisée sur `/cart` pour limiter la complexité UX.
- le comportement multi-restaurant est géré au checkout uniquement, pas au niveau de l’ajout de plat.
