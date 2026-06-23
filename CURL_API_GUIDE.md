# Guide de test API avec curl - Libreville Eats

Ce fichier liste toutes les commandes `curl` nécessaires pour tester les endpoints de l’API Libreville Eats.

## Pré-requis

- Le serveur doit être démarré depuis la racine du projet :
  ```bash
  npm install
  npm run dev
  ```
- Le serveur écoute par défaut sur `http://localhost:5000`.
- Pour les endpoints protégés, tu dois utiliser un JWT valide reçu avec `POST /api/auth/login`.

## Variables utiles

- `BASE_URL=http://localhost:5000`
- `TOKEN=<TON_JWT_TOKEN>`
- `RESTAURANT_ID=<ID_DU_RESTAURANT>`
- `ORDER_ID=<ID_DE_LA_COMMANDE>`
- `DELIVERER_ID=<ID_DU_LIVREUR>`

## Commandes générales

### 1. Créer un compte

```bash
curl -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "password": "Password123",
    "profile": {
      "firstName": "Jean",
      "lastName": "Dupont",
      "phone": "+24101234567"
    },
    "role": "CUSTOMER"
  }'
```

### 2. Se connecter et récupérer un token

```bash
curl -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "password": "Password123"
  }'
```

> Copie la valeur `token` de la réponse dans la variable `TOKEN`.

### 3. Vérifier le profil utilisateur (JWT requis)

```bash
curl "$BASE_URL/api/users/profile" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Mettre à jour le profil utilisateur (JWT requis)

```bash
curl -X PUT "$BASE_URL/api/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "profile": {
      "firstName": "Jean-Pierre",
      "lastName": "Dupont",
      "phone": "+24107654321"
    },
    "addresses": [
      {
        "label": "HOME",
        "street": "123 Avenue de l'Indépendance",
        "district": "Nombakélé",
        "city": "Libreville",
        "zipCode": "00000"
      }
    ]
  }'
```

## Endpoints restaurants

### 5. Lister tous les restaurants

```bash
curl "$BASE_URL/api/restaurants"
```

### 6. Lister les restaurants proches

```bash
curl "$BASE_URL/api/restaurants/nearby"
```

### 7. Obtenir un restaurant par son ID

```bash
curl "$BASE_URL/api/restaurants/$RESTAURANT_ID"
```

### 8. Mettre à jour un restaurant (JWT requis, rôle `VENDOR` ou `ADMIN`)

```bash
curl -X PATCH "$BASE_URL/api/restaurants/$RESTAURANT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Nouvelle maison du Gabon",
    "isOpen": true
  }'
```

## Endpoints commandes

### 9. Créer une commande (JWT requis)

```bash
curl -X POST "$BASE_URL/api/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "restaurantId": "'$RESTAURANT_ID'",
    "deliveryInfo": {
      "address": {
        "street": "12 Rue du Marché",
        "district": "Akébé-Poteau",
        "city": "Libreville",
        "notes": "Sonner à la porte"
      },
      "recipientName": "Jean Dupont",
      "recipientPhone": "+24101234567"
    },
    "paymentMethod": "CASH",
    "items": [
      {
        "dishId": "dish123",
        "dishName": "Poulet braisé",
        "unitPrice": 8000,
        "quantity": 1
      }
    ]
  }'
```

### 10. Lister les commandes de l’utilisateur (JWT requis)

```bash
curl "$BASE_URL/api/orders" \
  -H "Authorization: Bearer $TOKEN"
```

### 11. Obtenir une commande par son ID (JWT requis)

```bash
curl "$BASE_URL/api/orders/$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### 12. Mettre à jour le statut d’une commande (JWT requis)

```bash
curl -X PATCH "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "PREPARING",
    "note": "Commande en préparation"
  }'
```

### 13. Affecter un livreur à une commande (JWT requis)

```bash
curl -X POST "$BASE_URL/api/orders/$ORDER_ID/assign" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "delivererId": "'$DELIVERER_ID'"
  }'
```

### 14. Supprimer une commande (JWT requis)

```bash
curl -X DELETE "$BASE_URL/api/orders/$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

## Endpoints livreurs

### 15. Lister les livreurs disponibles

```bash
curl "$BASE_URL/api/deliverers"
```

### 16. Obtenir un livreur par son ID

```bash
curl "$BASE_URL/api/deliverers/$DELIVERER_ID"
```

### 17. Mettre à jour la position d’un livreur (JWT requis)

```bash
curl -X PUT "$BASE_URL/api/deliverers/$DELIVERER_ID/location" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "lat": -0.4167,
    "lng": 9.4500
  }'
```

## Notes importantes

- Pour toutes les requêtes `POST`, `PUT` et `PATCH`, utilise l’en-tête :
  - `Content-Type: application/json`
- Pour les requêtes protégées, ajoute :
  - `Authorization: Bearer $TOKEN`
- Si tu veux tester sur un port différent, remplace `BASE_URL` par `http://localhost:<port>`.
- Les IDs doivent être valides et correspondant aux documents réels de la base de données.
