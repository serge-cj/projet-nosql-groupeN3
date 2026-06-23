# Phase 1.1 : Modélisation NoSQL (MongoDB)

## Objectif
Définir la structure des collections principales avec un arbitrage explicite entre **embedding** (imbrication) et **referencing** (référencement).

---

## Architecture Globale

### 1. Collection `restaurants`
**Enjeu** : Balancer entre commodité de lecture et flexibilité de mise à jour.

#### Structure Proposée (Embedding + Referencing Hybride)

```json
{
  "_id": ObjectId,
  "name": "Chez Albert - Libreville",
  "email": "albert@example.com",
  "phone": "+241061234567",
  "address": {
    "street": "Boulevard Bessieux",
    "district": "Quartier Nombakélé",
    "city": "Libreville",
    "zipCode": "BP 123",
    "coordinates": { "type": "Point", "coordinates": [9.4583, 0.4162] }
  },
  "hours": {
    "monday": { "open": "11:00", "close": "23:00" },
    "tuesday": { "open": "11:00", "close": "23:00" },
    "wednesday": { "open": "11:00", "close": "23:00" },
    "thursday": { "open": "11:00", "close": "23:00" },
    "friday": { "open": "11:00", "close": "00:00" },
    "saturday": { "open": "10:00", "close": "01:00" },
    "sunday": { "open": "10:00", "close": "23:00" }
  },
  "isOpen": true,
  "rating": 4.5,
  "reviewCount": 127,
  
  // EMBEDDED : Menus et plats (raison : fréquent accès ensemble)
  "menus": [
    {
      "_id": ObjectId,
      "name": "Menu Principal",
      "description": "Plats populaires",
      "dishes": [
        {
          "_id": ObjectId,
          "name": "Poulet Nyembwe",
          "description": "Poulet sauce cacahuète épicée",
          "price": 3500,  // FCFA
          "currency": "FCFA",
          "category": "Plats Principaux",
          "isAvailable": true,
          "quantity": 45,  // Rupture de stock gérable ici
          "image": "poulet-nyembwe.jpg",
          "preparationTime": 15  // minutes
        },
        {
          "_id": ObjectId,
          "name": "Attiéké Accompagnement",
          "description": "Attiéké avec sauce poisson",
          "price": 1500,
          "currency": "FCFA",
          "category": "Accompagnements",
          "isAvailable": true,
          "quantity": 120,
          "preparationTime": 5
        }
      ]
    }
  ],
  
  "deliveryZones": [
    {
      "zone": "Quartier Nombakélé",
      "deliveryFee": 1000,
      "deliveryTime": 30
    },
    {
      "zone": "Quartier Batavéa",
      "deliveryFee": 1500,
      "deliveryTime": 45
    }
  ],
  
  "owner_id": ObjectId,  // REF : lien vers l'utilisateur propriétaire
  
  "metadata": {
    "createdAt": ISODate,
    "updatedAt": ISODate,
    "totalOrders": 342,
    "totalRevenue": 1234567
  }
}
```

**Justification** :
- ✅ **Embedding des menus/plats** : Les clients accèdent ensemble, mises à jour moins fréquentes
- ✅ **Referencing de owner_id** : Un propriétaire gère plusieurs restaurants
- ✅ **Embedding des zones de livraison** : Petite taille, peu de mises à jour
- ❌ **Pas embedding des commandes** : Les commandes évoluent, croissance non liée

---

### 2. Collection `commandes` (Orders)
**Enjeu** : Machine à états pour le suivi + tracé GPS du livreur horodaté.

#### Structure Proposée

```json
{
  "_id": ObjectId,
  
  // Références principales
  "customer_id": ObjectId,          // REF : vers collection users
  "restaurant_id": ObjectId,        // REF : vers collection restaurants
  "deliverer_id": ObjectId,         // REF : vers collection deliverers (null si retrait)
  
  // Contenu de la commande
  "items": [
    {
      "dishId": ObjectId,
      "dishName": "Poulet Nyembwe",
      "quantity": 2,
      "unitPrice": 3500,
      "totalPrice": 7000
    },
    {
      "dishId": ObjectId,
      "dishName": "Attiéké Accompagnement",
      "quantity": 1,
      "unitPrice": 1500,
      "totalPrice": 1500
    }
  ],
  
  "pricing": {
    "subtotal": 8500,
    "deliveryFee": 1000,
    "discount": 0,
    "tax": 0,
    "total": 9500,
    "currency": "FCFA"
  },
  
  // Statut et Machine à États
  "status": "DELIVERY_IN_PROGRESS",  // Enum: PENDING, CONFIRMED, PREPARING, READY_FOR_DELIVERY, DELIVERY_IN_PROGRESS, DELIVERED, CANCELLED, FAILED
  
  "statusHistory": [
    {
      "status": "PENDING",
      "timestamp": ISODate("2024-01-15T10:30:00Z"),
      "note": "Commande créée"
    },
    {
      "status": "CONFIRMED",
      "timestamp": ISODate("2024-01-15T10:35:00Z"),
      "note": "Restaurant a confirmé"
    },
    {
      "status": "PREPARING",
      "timestamp": ISODate("2024-01-15T10:40:00Z"),
      "note": "Préparation en cours"
    },
    {
      "status": "READY_FOR_DELIVERY",
      "timestamp": ISODate("2024-01-15T10:55:00Z"),
      "note": "Prêt pour livraison"
    },
    {
      "status": "DELIVERY_IN_PROGRESS",
      "timestamp": ISODate("2024-01-15T11:00:00Z"),
      "note": "Livreur en route"
    }
  ],
  
  // Tracé GPS du livreur (horodaté)
  "deliveryTracking": [
    {
      "timestamp": ISODate("2024-01-15T11:00:30Z"),
      "coordinates": { "type": "Point", "coordinates": [9.4583, 0.4162] },
      "speed": 25.5,  // km/h
      "distance": 0.0  // km depuis restaurant
    },
    {
      "timestamp": ISODate("2024-01-15T11:05:00Z"),
      "coordinates": { "type": "Point", "coordinates": [9.4640, 0.4200] },
      "speed": 32.0,
      "distance": 0.8
    },
    {
      "timestamp": ISODate("2024-01-15T11:10:00Z"),
      "coordinates": { "type": "Point", "coordinates": [9.4720, 0.4280] },
      "speed": 28.5,
      "distance": 1.5
    }
  ],
  
  // Détails de livraison
  "deliveryInfo": {
    "type": "DELIVERY",  // DELIVERY ou PICKUP
    "address": {
      "street": "Avenue de l'Indépendance",
      "district": "Quartier Batavéa",
      "city": "Libreville",
      "notes": "Bâtiment bleu, 3e étage"
    },
    "recipientName": "Jean Dupont",
    "recipientPhone": "+241061111111",
    "estimatedDeliveryTime": ISODate("2024-01-15T11:20:00Z"),
    "actualDeliveryTime": null
  },
  
  // Paiement
  "payment": {
    "method": "CASH",  // CASH, CARD, MOBILE_MONEY
    "status": "PENDING",  // PENDING, COMPLETED, FAILED
    "transactionId": null
  },
  
  "notes": "Pas de piment, s'il vous plaît",
  
  "metadata": {
    "createdAt": ISODate("2024-01-15T10:30:00Z"),
    "updatedAt": ISODate("2024-01-15T11:10:00Z"),
    "estimatedPreparationTime": 25,  // minutes
    "actualPreparationTime": null
  }
}
```

**Justification** :
- ✅ **Referencing (customer, restaurant, deliverer)** : Données volatiles, pas de croissance non liée
- ✅ **Embedding des items** : Snapshot immutable, pas besoin de lier dynamiquement
- ✅ **statusHistory embedded** : Audit trail, taille prévisible
- ✅ **deliveryTracking embedded** : Time-series locale, requêtes souvent sur la dernière position
- ✅ **Machine à états explicite** : Validation à l'application

---

### 3. Collection `deliverers` (Livreurs)
**Enjeu** : Performance des requêtes temps réel.

#### Structure Proposée

```json
{
  "_id": ObjectId,
  
  "user_id": ObjectId,  // REF : vers collection users
  
  "personalInfo": {
    "firstName": "Ahmed",
    "lastName": "Makanda",
    "phone": "+241061234567",
    "email": "ahmed@example.com",
    "idCardNumber": "LA2024001234",
    "idCardExpiry": ISODate("2026-12-31")
  },
  
  "vehicleInfo": {
    "type": "MOTORCYCLE",  // MOTORCYCLE, SCOOTER, BICYCLE, CAR
    "licensePlate": "LA2024ABC",
    "color": "Red",
    "insuranceExpiry": ISODate("2025-12-31")
  },
  
  "currentLocation": {
    "type": "Point",
    "coordinates": [9.4583, 0.4162],
    "lastUpdated": ISODate
  },
  
  "isActive": true,
  "isAvailable": true,
  
  "performanceMetrics": {
    "totalDeliveries": 342,
    "totalEarnings": 1234567,  // FCFA
    "averageRating": 4.7,
    "ratingCount": 285,
    "cancelledDeliveries": 3,
    "averageDeliveryTime": 28  // minutes
  },
  
  "bankInfo": {
    "accountHolder": "Ahmed Makanda",
    "bankName": "BGFI Bank Gabon",
    "accountNumber": "1234567890",
    "iban": "GA061234567890"
  },
  
  "documents": [
    {
      "type": "IDENTITY",
      "url": "s3://bucket/ahmed-id.jpg",
      "verified": true,
      "verifiedAt": ISODate
    },
    {
      "type": "INSURANCE",
      "url": "s3://bucket/ahmed-insurance.jpg",
      "verified": true,
      "verifiedAt": ISODate
    }
  ],
  
  "availability": {
    "monday": { "available": true, "startTime": "08:00", "endTime": "22:00" },
    "tuesday": { "available": true, "startTime": "08:00", "endTime": "22:00" },
    // ...
    "sunday": { "available": false }
  },
  
  "metadata": {
    "createdAt": ISODate,
    "updatedAt": ISODate
  }
}
```

**Justification** :
- ✅ **Referencing de user_id** : Un livreur = un utilisateur
- ✅ **Embedding de location, metrics, docs** : Petite taille, accès fréquent
- ✅ **Pas embedding des commandes** : Croissance non liée

---

### 4. Collection `users`
Structure centralisée pour authentification et profils.

```json
{
  "_id": ObjectId,
  
  "email": "user@example.com",
  "password": "$2b$10$...",  // Hashed
  "role": "CUSTOMER",  // CUSTOMER, VENDOR, DELIVERER, ADMIN
  
  "profile": {
    "firstName": "Jean",
    "lastName": "Dupont",
    "phone": "+241061234567",
    "avatar": "https://s3.../avatar.jpg"
  },
  
  "addresses": [
    {
      "_id": ObjectId,
      "label": "Home",
      "street": "Avenue de l'Indépendance",
      "district": "Batavéa",
      "city": "Libreville",
      "coordinates": { "type": "Point", "coordinates": [9.4720, 0.4280] },
      "isDefault": true
    }
  ],
  
  "isActive": true,
  "emailVerified": true,
  "phoneVerified": false,
  
  "metadata": {
    "createdAt": ISODate,
    "updatedAt": ISODate,
    "lastLogin": ISODate
  }
}
```

---

## Index Strategy

### Requis pour Phase 3

| Collection | Fields | Type | Justification |
|-----------|--------|------|---------------|
| `commandes` | `status, restaurant_id` | Compound | Lister commandes actives par restaurant |
| `commandes` | `customer_id, createdAt` | Compound | Historique client trié |
| `restaurants` | `address.coordinates` | Geospatial | Recherche par proximité |
| `restaurants` | `menus.dishes.isAvailable` | Single | Afficher disponibilité |
| `deliverers` | `currentLocation` | Geospatial | Trouver livreurs disponibles |
| `users` | `email` | Unique | Authentification rapide |

---

## Résumé des Choix

| Concept | Choix | Raison |
|---------|-------|--------|
| Menus & plats | Embedded | Accès fréquent ensemble, peu d'évolution |
| Commandes | Referenced | Évolution rapide, croissance non liée |
| Utilisateurs | Referenced | Dénormalisation minimale, scalabilité |
| Tracé GPS | Embedded (time-series local) | Requêtes temps-réel sur la dernière position |
| Historique statuts | Embedded | Audit trail, taille prévisible |

---

## Next Steps
- Phase 1.2 : Design Redis caching
- Phase 1.3 : Initialiser MongoDB Atlas
- Phase 2.1 : Seed script avec données gabonaises
