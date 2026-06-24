# Phase 1.2 : Architecture de Caching (Redis)

## Objectif
Rédiger une note de conception technique expliquant la complémentarité entre MongoDB (persistance) et Redis (gestion du panier temporaire et mise en cache des statuts en temps réel).

---

## Contexte Applicatif

**Libreville Eats** est une plateforme de livraison de repas avec :
- Pics d'activité imprévisibles
- Données temps-réel critique (statut livraison, disponibilité plats)
- Sessions utilisateur éphémères (paniers, favoris)

**Défi** : MongoDB ne peut seul gérer les écritures fréquentes (positions GPS livreur toutes les 30s, mises à jour panier). Redis complète MongoDB en offrant une **couche de mémoire ultra-rapide**.

---

## Architecture Générale

```
┌─────────────────┐
│   Client App    │
│  (React/Vue)    │
└────────┬────────┘
         │
         v
┌─────────────────────────────────────────────┐
│        Express.js API Gateway               │
├─────────────────────────────────────────────┤
│  Middleware: Auth, Validation, Rate Limit   │
└───────┬──────────────────────────┬──────────┘
        │                          │
        v                          v
   [REDIS]                    [MONGODB]
   Ephemeral                   Persistent
   <30 sec - 24h               Forever
└────────────────────────────────────────────┘
```

---

## Cas d'Usage Détaillés

### 1. Gestion du Panier (Session Utilisateur)

**Problème MongoDB** : Écriture à chaque ajout/suppression item → IO disque expensive

**Solution Redis** :

```javascript
// Clé : cart:{userId}
// Valeur : Hash Redis
{
  "dish_id_1": { quantity: 2, price: 3500 },
  "dish_id_2": { quantity: 1, price: 1500 }
}

// TTL : 24 heures (si utilisateur n'achète pas, panier expiré)
```

**Opérations** :
```javascript
// Ajouter au panier
await redis.hset(`cart:${userId}`, dishId, 
  JSON.stringify({ quantity: qty, price: dishPrice }));
await redis.expire(`cart:${userId}`, 86400);  // 24h

// Récupérer panier
const cart = await redis.hgetall(`cart:${userId}`);

// À la validation commande : sauvegarder dans MongoDB & vider Redis
await Order.create({ items: cartItems, ... });
await redis.del(`cart:${userId}`);
```

**Gain** : O(1) vs O(n) updateMany en MongoDB

---

### 2. Statuts de Livraison en Temps Réel

**Problème MongoDB** : `.find({ status: "DELIVERY_IN_PROGRESS" })` + mise à jour GPS = bottleneck

**Solution Redis** :

```javascript
// Clé : order:{orderId}:status
// Valeur : String (simple) + Set d'expiration
{
  "status": "DELIVERY_IN_PROGRESS",
  "deliverer_id": "64d1a2f3e4c5b6a7f8e9d0c1",
  "estimatedArrival": "2024-01-15T11:20:00Z",
  "lastUpdate": "2024-01-15T11:10:15Z"
}

// TTL : 2 heures (après, commande archivée dans MongoDB)
```

**Opérations** :
```javascript
// Récupérer statut live (ultra-rapide pour WebSocket)
const status = await redis.hgetall(`order:${orderId}:status`);

// Lister toutes commandes actives
const activeOrders = await redis.keys('order:*:status');

// Mise à jour statu (1ms vs 50ms MongoDB)
await redis.hset(`order:${orderId}:status`, {
  status: "DELIVERED",
  actualDeliveryTime: new Date().toISOString()
});

// Après 2h, sync avec MongoDB et archiver
await Order.updateOne(
  { _id: orderId },
  { status: "DELIVERED", deliveryTracking: [...] }
);
await redis.del(`order:${orderId}:status`);
```

**Gain** : Sub-millisecond vs centaines ms MongoDB. WebSocket temps-réel fluide.

---

### 3. Positions GPS du Livreur (Time-Series)

**Problème MongoDB** : `deliveryTracking[]` pousse 1 doc/30s = croissance explosive

**Solution Redis Streams** :

```javascript
// Clé : deliverer:gps:{delivererId}:stream
// Structure : Time-series optimisée

{
  "id": "1705323615000-0",
  "timestamp": "1705323615000",
  "latitude": "0.4162",
  "longitude": "9.4583",
  "speed": "25.5",
  "heading": "45"
}
// Avec : MAXLEN ~ 500  (garder les 500 derniers points)
```

**Opérations** :
```javascript
// Ajouter position (atômique)
await redis.xadd(
  `deliverer:gps:${delivererId}:stream`,
  '*',  // Auto-ID par timestamp
  'lat', latitude,
  'lng', longitude,
  'speed', speed,
  'heading', heading
);

// Capper le stream à 500 entrées (glissement fenêtre)
await redis.xtrim(`deliverer:gps:${delivererId}:stream`, 
  'MAXLEN', '~', 500);

// Récupérer les 10 dernières positions (pour tracer chemin frontend)
const positions = await redis.xrevrange(
  `deliverer:gps:${delivererId}:stream`,
  '+',
  '-',
  'COUNT', 10
);

// À la fin de livraison : snapshot PostgreSQL/MongoDB
await Order.updateOne(
  { _id: orderId },
  { deliveryTracking: positions.map(p => ({ 
    timestamp: p.timestamp,
    coordinates: { lat: p.lat, lng: p.lng },
    speed: p.speed
  })) }
);
```

**Gain** : Redis Streams = O(1) vs MongoDB array growth O(n)

---

### 4. Favoris & Recommendations (Cache Warm)

**Redis Set** pour favoris utilisateur :

```javascript
// Clé : favorites:{userId}
// Valeur : Set de dishIds

// Ajouter aux favoris (1ms)
await redis.sadd(`favorites:${userId}`, dishId);

// Récupérer favoris (1ms)
const favDishIds = await redis.smembers(`favorites:${userId}`);

// Persister en MongoDB (sync nightly ou au logout)
await User.updateOne(
  { _id: userId },
  { favoritesDishes: favDishIds }
);
```

---

### 5. Disponibilité Plats (Cache Invalidation)

**Problème** : `restaurant.menus[0].dishes[0].isAvailable` change fréquemment

**Solution** : Tier de cache Redis avec invalidation événementielle

```javascript
// Clé : dish:available:{restaurantId}:{dishId}
// Valeur : Boolean + stock

{
  "isAvailable": true,
  "quantity": 45,
  "lastUpdated": "2024-01-15T11:10:00Z"
}

// TTL : 5 minutes (fallback MongoDB après)
```

**Pattern Cache-Aside** :

```javascript
async function getDishAvailability(restaurantId, dishId) {
  const cached = await redis.hgetall(
    `dish:available:${restaurantId}:${dishId}`
  );
  
  if (cached && cached.isAvailable) {
    return { found: true, ...cached };
  }
  
  // Cache miss → MongoDB
  const dish = await Restaurant.findOne(
    { _id: restaurantId, "menus.dishes._id": dishId },
    { "menus.dishes.$": 1 }
  );
  
  // Warm cache
  if (dish) {
    const dishData = dish.menus[0].dishes[0];
    await redis.hset(
      `dish:available:${restaurantId}:${dishId}`,
      {
        isAvailable: dishData.isAvailable,
        quantity: dishData.quantity,
        lastUpdated: new Date().toISOString()
      }
    );
    await redis.expire(`dish:available:${restaurantId}:${dishId}`, 300);
  }
  
  return dish?.menus[0].dishes[0];
}
```

**Invalidation** (à chaque update plat) :

```javascript
// Dans le contrôleur update
await redis.del(`dish:available:${restaurantId}:${dishId}`);
```

**Gain** : 99% cache hits = 1000x+ plus rapide

---

## Politique de TTL (Time-To-Live)

| Clé | Raison | TTL |
|-----|--------|-----|
| `cart:{userId}` | Session | 24 heures |
| `order:{orderId}:status` | Livraison active | 2 heures |
| `deliverer:gps:*:stream` | Temps-réel | Glissement fenêtre (500 entrées) |
| `favorites:{userId}` | Pas critique | 7 jours |
| `dish:available:*` | Volatilité haute | 5 minutes |
| `session:{sessionId}` | Auth | 7 jours |

---

## Architecture de Resilience

### Fallback MongoDB

```javascript
async function getOrderStatus(orderId) {
  try {
    // 1. Essayer Redis (fast path)
    const cachedStatus = await redis.hgetall(
      `order:${orderId}:status`
    );
    if (cachedStatus && cachedStatus.status) {
      return cachedStatus;  // Hit
    }
  } catch (err) {
    logger.warn('Redis unavailable, falling back to MongoDB');
  }
  
  // 2. Fallback MongoDB
  const order = await Order.findById(orderId);
  return { status: order.status, deliverer_id: order.deliverer_id };
}
```

### Warm-up Cache au Démarrage

```javascript
// Lancer à l'init serveur
async function warmCacheAtStartup() {
  // Charger commandes actives dans Redis
  const activeOrders = await Order.find({
    status: { $in: ["PENDING", "CONFIRMED", "PREPARING", 
                    "READY_FOR_DELIVERY", "DELIVERY_IN_PROGRESS"] }
  });
  
  for (const order of activeOrders) {
    await redis.hset(
      `order:${order._id}:status`,
      {
        status: order.status,
        deliverer_id: order.deliverer_id || null
      }
    );
    await redis.expire(`order:${order._id}:status`, 7200);  // 2h
  }
  
  logger.info(`Warmed ${activeOrders.length} active orders in Redis`);
}
```

---

## Monitoring & Metrics

### Redis Metrics à Tracker

```javascript
// Dans middleware ou periodicTask
const info = await redis.info('stats');
// Parse et expose:
// - connected_clients
// - used_memory / used_memory_peak
// - total_commands_processed
// - evicted_keys (signe d'OOM)
// - cache_hits / cache_misses
```

---

## Next Steps

- **Phase 1.3** : Initialiser MongoDB Atlas + Redis Cloud (ou Docker local)
- **Phase 2.1** : Seed script avec données gabonaises
- **Phase 3** : Implémenter les contrôleurs avec caching actif

---

## Résumé Complémentarité

| Besoin | MongoDB | Redis | Choix |
|--------|---------|-------|-------|
| Persistance | ✅ | ❌ | MongoDB |
| Vitesse écriture | 50-100ms | <1ms | Redis (+ async write-back MongoDB) |
| Requêtes complexes | ✅ | Limited | MongoDB (agrégations) |
| Sessions éphémères | ❌ | ✅ | Redis |
| Time-series temps-réel | ❌ | ✅ | Redis Streams |
| Scalabilité read | Réplication | Cluster | Les deux |

**Résultat final** : Latence ultra-faible pour utilisateur + persistance durable + coûts optimisés ✅
