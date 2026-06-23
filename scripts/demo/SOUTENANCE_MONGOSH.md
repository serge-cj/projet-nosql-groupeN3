# Démo mongosh — 5 minutes (soutenance)

## Préparation (avant la salle)

```bash
# 1. Démarrer MongoDB (local ou Atlas)
# 2. Peupler la base
npm run seed
node scripts/demo/seed-commandes-demo.js

# 3. Vérifier
mongosh "mongodb://localhost:27017/libreville_eats" --eval "db.commandes.countDocuments()"
# → doit afficher 45
```

Pour **Atlas**, remplacez l'URI :

```bash
mongosh "$MONGODB_URI" --file scripts/demo/soutenance-live.js
```

---

## Déroulé oral (5 min)

| Temps | Action | Ce que vous dites |
|-------|--------|-------------------|
| 0:00 | Ouvrir mongosh, `use libreville_eats` | « On part de Libreville Eats : commandes liées aux restaurants partenaires. » |
| 0:30 | **Partie 1** — agrégation | « On agrège le CA par restaurant, puis `$lookup` pour joindre le nom et le quartier. » |
| 2:30 | Montrer le résultat `printjson` | « Le `$lookup` remplace un JOIN SQL ; ici on croise `commandes.restaurant_id` → `restaurants._id`. » |
| 3:00 | **Partie 2** — `explain()` sans index | « Requête métier : commandes en PREPARING pour un restaurant. Sans index → COLLSCAN. » |
| 4:00 | Créer l'index, relancer `explain()` | « Index composé `{ status, restaurant_id }` → IXSCAN, moins de documents examinés. » |
| 4:45 | Synthèse | « MongoDB persiste ; Redis garderait le statut temps réel en cache. » |

---

## Lancement rapide (tout-en-un)

```bash
mongosh "mongodb://localhost:27017/libreville_eats" --file scripts/demo/soutenance-live.js
```

Ou section par section dans mongosh interactif :

```javascript
load('/chemin/absolu/Libreville-Eats-Backend/scripts/demo/soutenance-live.js')
```

---

## Partie 1 — Agrégation (copier-coller interactif)

```javascript
use('libreville_eats');

db.commandes.aggregate([
  { $match: { status: { $nin: ['CANCELLED', 'FAILED'] } } },
  {
    $group: {
      _id: '$restaurant_id',
      commandes: { $sum: 1 },
      caFcfa: { $sum: '$pricing.total' },
      livrees: { $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] } },
    },
  },
  {
    $lookup: {
      from: 'restaurants',
      localField: '_id',
      foreignField: '_id',
      as: 'restaurant',
    },
  },
  { $unwind: '$restaurant' },
  {
    $project: {
      restaurant: '$restaurant.name',
      quartier: '$restaurant.address.district',
      commandes: 1,
      caFcfa: 1,
      livrees: 1,
    },
  },
  { $sort: { caFcfa: -1 } },
]).pretty();
```

**Points à mentionner :**
- `$group` = agrégation analytique (équivalent `GROUP BY`)
- `$lookup` = jointure avec la collection `restaurants`
- `$match` après lookup = filtre sur le quartier de Libreville

---

## Partie 2 — explain() avant / après index

```javascript
const resto = db.restaurants.findOne();
const q = { status: 'PREPARING', restaurant_id: resto._id };

// AVANT — supprimer les index composés puis forcer un scan complet
db.commandes.dropIndex('idx_status_restaurant');
db.commandes.dropIndex('status_1_restaurant_id_1');
db.commandes.find(q).hint({ $natural: 1 }).explain('executionStats');
// → COLLSCAN (tous les documents parcourus)

// CRÉER l'index
db.commandes.createIndex(
  { status: 1, restaurant_id: 1 },
  { name: 'idx_status_restaurant' }
);

// APRÈS — utiliser l'index explicitement
db.commandes.find(q).hint({ status: 1, restaurant_id: 1 }).explain('executionStats');
// → IXSCAN (clés d'index parcourues, docsExamined réduit)
```

**Capture d'écran pour le rapport :**
- `totalDocsExamined` élevé **avant**
- `totalKeysExamined` > 0 et `totalDocsExamined` faible **après**

---

## Dépannage

| Problème | Solution |
|----------|----------|
| `commandes` vide | `node scripts/demo/seed-commandes-demo.js` |
| Pas de PREPARING | Relancer le seed commandes (statuts aléatoires) |
| Toujours IXSCAN avant drop | `db.commandes.getIndexes()` puis drop le bon nom |
| Atlas | Utiliser l'URI Atlas dans mongosh |

---

## Après la démo

Recréer tous les index du projet :

```bash
npm run indexes
```
