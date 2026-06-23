# Assignation de livreur — Design

Date: 2026-06-21

## Objectif

Permettre au vendeur d’assigner ou de réaffecter un livreur à une commande depuis le dashboard vendor.

L’assignation doit être possible pour tout statut de commande, et le vendeur doit pouvoir changer le livreur si une première affectation a déjà été faite.

## Contexte

Le backend expose déjà :
- `POST /orders/:id/assign` avec `{ delivererId }`
- `GET /deliverers` pour afficher les livreurs disponibles

Le frontend a déjà un composant `OrderManager` qui gère les commandes avec recherche, filtres et détails déroulables.

## UX cible

### Règles principales

- Le vendeur peut assigner un livreur à une commande à tout moment.
- Si une commande a déjà un livreur, le vendeur peut la réaffecter.
- L’assignation doit pouvoir se faire depuis :
  - la ligne / la carte de commande dans la liste active
  - la fiche détaillée développée de la commande

### Composants UX

1. Dans chaque commande active :
   - un badge indiquant `Livreur : —` ou `Livreur : <nom>`
   - un bouton `Assigner` ou `Modifier` selon le cas
2. Dans la vue détaillée du même ordre :
   - même contrôle de livreur
   - état visible du livreur actuellement assigné
3. Un panneau de sélection simple :
   - liste déroulante ou select de livreurs disponibles
   - boutons `Confirmer` / `Annuler`
   - message d’erreur clair si l’assignation échoue

## Architecture

### Frontend

#### `OrderManager`

- Ajoute un nouvel état local :
  - `availableDeliverers: Deliverer[]`
  - `assigningOrderId: string | null`
  - `selectedDelivererId: string | null`
- Récupère la liste des livreurs via `GET /deliverers` lorsque le vendeur ouvre une assignation.
- Affiche le contrôle d’assignation dans :
  - la carte de commande active
  - le panneau de détails étendu
- Appelle `api.post(`/orders/${orderId}/assign`, { delivererId })`
- Après succès, déclenche `onUpdate()` pour rafraîchir la liste des commandes

#### `Deliverer` interface

```ts
interface Deliverer {
  _id: string;
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  isAvailable?: boolean;
}
```

### Backend

Le backend est déjà prêt pour l’assignation :
- vérifie la présence de la commande
- vérifie le livreur existant et disponible
- empêche l’assignation si le livreur n’est pas actif/disponible
- met à jour `order.deliverer_id`
- invalide le cache
- émet un événement Socket.io `order:deliverer:assigned`

## Flux de données

1. Le vendeur ouvre le dashboard des commandes.
2. `OrderManager` affiche les commandes actives.
3. Le vendeur clique sur `Assigner` / `Modifier`.
4. Frontend charge `GET /deliverers` si besoin.
5. Le vendeur sélectionne un livreur.
6. Frontend envoie `POST /orders/:id/assign`.
7. Le backend affecte le livreur, puis renvoie succès.
8. `OrderManager` exécute `onUpdate()` pour rafraîchir les commandes.

## Cas d’usage

### Assignation initiale

- Statut `PENDING`, `CONFIRMED`, `PREPARING`, ou autre
- Aucun livreur assigné
- Bouton `Assigner`
- Confirme l’assignation

### Réaffectation

- Livreurs déjà assigné
- Bouton `Modifier`
- Permet de choisir un nouveau livreur
- Le backend accepte le changement

### Erreurs

- Livreurexclusif non trouvé => message `Livreur introuvable`
- Livreurnon disponible => message `Livreur non disponible`
- Problème réseau => message générique `Impossible d’assigner le livreur`

## Tests à couvrir

### Frontend

- assignation visible depuis la liste et depuis le détail
- sélection de livreur disponible
- gestion du bouton `Confirmer` / état en cours
- erreurs de validation affichées
- rechargement des commandes via `onUpdate()` après succès

### Backend

- `POST /orders/:id/assign` valide `delivererId`
- refuse l’assignation si le livreur n’est pas disponible
- permet l’assignation sur une commande déjà assignée
- invalidation du cache
- émission de l’événement Socket.io (le cas échéant)

## Alternatives envisagées

- modal centralisé de sélection de livreur
- assignation uniquement depuis le détail

### Pourquoi cette option

Elle offre la meilleure flexibilité pour le vendeur sans complexifier excessivement l’interface. Elle correspond directement aux besoins : assigner ou modifier rapidement, depuis la liste ou depuis le détail.

## Notes de mise en œuvre

- Le contrôle doit rester léger et cohérent avec le style Tailwind déjà utilisé.
- Si un livreur est déjà assigné, afficher son nom et un état `Assigné`.
- Les livreurs inactifs ne doivent pas apparaître dans le sélecteur.
- La liste des livreurs peut être rechargée à l’ouverture du panneau d’assignation.
