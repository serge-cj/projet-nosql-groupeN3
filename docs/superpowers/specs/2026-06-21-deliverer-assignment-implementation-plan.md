# Plan d’implémentation — Assignation de livreur

Date: 2026-06-21

## Objectif

Ajouter la fonctionnalité qui permet au vendeur d’assigner ou de réaffecter un livreur à une commande depuis le dashboard vendor.

Le flux doit fonctionner depuis la liste de commandes et depuis le détail de chaque commande active.

## Étapes

### 1. Vérifier l’API existante

- Confirmer que `POST /orders/:id/assign` existe et accepte `{ delivererId }`.
- Confirmer que `GET /deliverers` renvoie les livreurs disponibles.
- Vérifier les schémas et le contrôleur backend pour s’assurer que l’assignation permet une réaffectation.

### 2. Étendre le type de données côté frontend

- Ajouter l’interface `Deliverer` dans `frontend/app/restaurant/components/OrderManager.tsx` ou un type partagé approprié.
- Étendre la structure `RestaurantOrder` si nécessaire pour stocker `deliverer_id` ou `delivererName`.

### 3. Charger la liste des livreurs disponibles

- Ajouter un nouvel état `availableDeliverers` dans `OrderManager`.
- Charger la liste via `api.get('/deliverers?isAvailable=true')` :
  - au premier clic sur un bouton d’assignation
  - ou au chargement initial si la liste doit être réutilisée
- Gérer l’état de chargement et les erreurs.

### 4. Ajouter l’interface d’assignation dans la liste

- Sur chaque carte de commande active, afficher :
  - `Livreur : —` ou `Livreur : <nom>`
  - un bouton `Assigner` ou `Modifier`
- Ce bouton ouvre un petit panneau ou un menu inline avec :
  - un `select` de livreurs disponibles
  - un bouton `Confirmer`
  - un bouton `Annuler`

### 5. Ajouter l’interface dans le détail de la commande

- Dans le panneau détaillé étendu, afficher le même contrôle d’assignation.
- Montrer aussi l’état courant de l’assignation :
  - `Aucun livreur assigné`
  - `Livreur assigné : <nom>`

### 6. Envoyer l’assignation au backend

- Implémenter une fonction `handleAssignDeliverer(orderId, delivererId)` qui :
  - envoie `POST /orders/${orderId}/assign` avec `{ delivererId }`
  - gère l’état de sauvegarde (`assigningOrderId`)
  - rafraîchit les commandes via `onUpdate()` sur succès
  - affiche un message d’erreur utilisable sur échec

### 7. Gérer la réaffectation

- Permettre au vendeur de choisir un autre livreur si un livreur est déjà assigné.
- Nommer le bouton `Modifier` dans ce cas.
- Si le backend rejette la requête (livreur non disponible, introuvable), afficher l’erreur retournée.

### 8. Test frontend

- Tester le rendu de la carte de commande avec bouton `Assigner`.
- Tester l’ouverture du panneau d’assignation et la sélection d’un livreur.
- Vérifier que `POST /orders/:id/assign` est appelé avec le bon `delivererId`.
- Vérifier que `onUpdate()` est appelé après succès.
- Tester l’affichage des erreurs.

### 9. Test backend

- Ajouter/valider les tests pour `assignDeliverer` :
  - assignation réussie pour une commande sans livreur
  - réaffectation d’une commande déjà assignée
  - refus si le livreur est inactif ou indisponible
  - refus si le livreur n’existe pas
  - refus si la commande n’existe pas

### 10. Vérification finale

- Lancer les tests backend et frontend.
- Vérifier le dashboard vendor en local.
- Valider qu’on peut assigner et réaffecter un livreur depuis la liste et depuis le détail.

## Priorités

1. Backend : confirmer et valider l’API d’assignation
2. Frontend : ajouter le contrôle dans la liste
3. Frontend : ajouter le contrôle dans le détail
4. Tests automatisés

## Notes d’intégration

- Si `GET /deliverers` est lent, on peut introduire un cache de session ou un chargement asynchrone sur ouverture.
- L’assignation peut être faite à tout statut, donc le contrôle doit être visible sur toutes les commandes actives, pas seulement `READY_FOR_DELIVERY`.
- Le composant doit rester réutilisable et léger ; éviter un modal volumineux si un menu inline suffit.
