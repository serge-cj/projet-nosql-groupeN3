# Restaurant Product CRUD Design

Date: 2026-06-20

## Objectif

Permettre aux restaurateurs de gérer les plats de leur restaurant via le dashboard existant.
La V1 se concentre sur la gestion de plats avec un CRUD simple, une image principale, et une modale unique pour ajouter/éditer.

## Portée MVP

Inclus :
- Liste des plats du restaurant
- Création d'un plat
- Mise à jour d'un plat
- Suppression d'un plat
- Upload d'une image JPG/PNG principale par plat
- Statut de disponibilité du plat
- Catégorie de plat
- Utilisation d'un menu unique par restaurant (`Menu Principal`)

Exclus de la V1 :
- Plusieurs menus
- Galerie d'images
- Gestion de variantes/options
- Édition de profil restaurant
- Planification des horaires de mise en ligne

## Données et modèle

Le backend utilise déjà le schéma `Restaurant` avec :
- `menus[]`
  - `name`
  - `description`
  - `dishes[]`
    - `name`
    - `description`
    - `price`
    - `currency`
    - `category`
    - `isAvailable`
    - `image`

Pour l'expérience MVP, on gère un seul menu par restaurant : `menus[0]` / `Menu Principal`.
Si aucun menu n'existe lors de la première création de plat, le backend crée automatiquement ce menu.

## API et séparation d'upload (Approach A)

### Endpoints REST

- `GET /api/restaurants/:id`
  - retourne les informations de restaurant et ses menus / plats

- `POST /api/restaurants/:id/menus/:menuId/dishes`
  - crée un plat dans le menu spécifié
  - accepte les champs de métadonnées sans fichier

- `PATCH /api/restaurants/:id/menus/:menuId/dishes/:dishId`
  - met à jour un plat existant
  - accepte les champs de métadonnées sans fichier

- `DELETE /api/restaurants/:id/menus/:menuId/dishes/:dishId`
  - supprime un plat

- `POST /api/restaurants/:id/menus/:menuId/dishes/:dishId/image`
  - upload multipart d'une image JPG/PNG
  - enregistre l'URL dans `dish.image`

### Raisonnement

Cette séparation permet de conserver la logique de fichier isolée du CRUD métier.
Le frontend effectue d'abord la création/mise à jour des données, puis l'upload en second temps si une image est fournie.
Ceci simplifie la validation et limite les risques de corruption de payload.

## Comportement UI

### Section du dashboard

Ajouter une section "Mes plats" sur la page `restaurant/dashboard` existante, avec :
- compteur total de plats
- compteur de plats disponibles
- bouton `Ajouter un plat`

### Liste des plats

Chaque ligne de la liste affiche :
- vignette de l'image
- nom du plat
- prix + devise
- catégorie
- statut disponible / indisponible
- actions : `Modifier`, `Supprimer`

### Modal de création / édition

La même modale sert pour :
- `Ajouter un plat`
- `Modifier`

Champs :
- Nom du plat
- Description courte
- Prix
- Catégorie (sélecteur)
- Disponible (toggle)
- Image JPG/PNG

### Suppression

- action de suppression avec confirmation rapide
- confirmation textuelle, pas de modal trop lourde

## Stockage des images

Pour MVP, les images sont stockées localement sur le serveur backend :
- dossier `public/uploads/dishes`
- URL accessible via le champ `dish.image`
- validation des types JPG / PNG
- nommage unique basé sur `dishId` + timestamp

## Validation et sécurité

### Backend

- vérification de la propriété du restaurant pour toutes les modifications
- validation des champs obligatoires et des formats (prix numérique, catégorie valide)
- validation `multipart/form-data` sur l'upload image
- rejet des formats non autorisés

### Frontend

- interface claire de validation de formulaire
- garde modale ouverte en cas d'erreur
- message d'erreur clair côté client et serveur
- upload d'image optionnel en édition

## Erreurs et gestion d'état

- afficher des messages d'erreur au-dessus de la modale ou dans la liste
- indiquer les états de chargement pendant les appels API
- rafraîchir la liste après création / mise à jour / suppression
- invalider le cache restaurant côté backend après modification

## Points de conception

- réutiliser le modèle de modale pour les deux actions
- garder le tableau de plats léger et lisible
- ne pas ajouter de navigation de page supplémentaire pour la V1
- permettre une extension future facile vers plusieurs menus

## Prochaines étapes

1. Écrire l'implémentation backend : routes, contrôleurs, validation, upload
2. Écrire le frontend du tableau et de la modale
3. Tester le flux complet create/update/delete avec image upload
4. Ajouter des tests backend et frontend pour le CRUD
