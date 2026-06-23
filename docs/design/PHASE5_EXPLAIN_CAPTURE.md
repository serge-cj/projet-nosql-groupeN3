# Phase 5 : Capture explain('executionStats') — COLLSCAN → IXSCAN

## Objectif

Démontrer par la preuve (`explain('executionStats')`) que l'index composé
`{ status: 1, restaurant_id: 1 }` sur la collection `commandes` transforme
un parcours complet de collection (**COLLSCAN**) en un parcours d'index
ciblé (**IXSCAN**), conformément à l'exigence du socle obligatoire
(section 3.1, point 5).

## Contexte de la mesure

- Collection `commandes` : **500 documents** (jeu de données de
  démonstration, restaurants/clients réels de la base `libreville_eats`).
- Requête testée — cas d'usage réel : *lister les commandes `CONFIRMED`
  d'un restaurant donné* (utilisé par le tableau de bord du vendeur) :

  ```js
  db.commandes.find({
    status: "CONFIRMED",
    restaurant_id: ObjectId("6a2feaba46b300b4a537ec97"),
  })
  ```

- Méthode : l'index composé `status_1_restaurant_id_1` a été
  **temporairement supprimé** (`dropIndex`) pour mesurer le plan sans
  index, puis **recréé à l'identique** (`createIndex`) pour mesurer le
  plan avec index. La base n'a subi aucune perte de données : l'index
  est revenu à son état initial à l'issue de la mesure.

## Avant index — COLLSCAN

```json
{
  "winningPlan": {
    "stage": "COLLSCAN",
    "filter": {
      "$and": [
        { "restaurant_id": { "$eq": "ObjectId(6a2feaba46b300b4a537ec97)" } },
        { "status": { "$eq": "CONFIRMED" } }
      ]
    },
    "direction": "forward"
  }
}
```

| Métrique | Valeur |
|---|---|
| Stage gagnant | `COLLSCAN` |
| Documents examinés (`totalDocsExamined`) | **500** (toute la collection) |
| Clés d'index examinées (`totalKeysExamined`) | 0 |
| Documents retournés (`nReturned`) | 12 |
| Temps d'exécution | 0 ms (collection encore petite ; l'écart se creuse avec le volume) |

Sans index, MongoDB doit lire l'intégralité des 500 documents de la
collection pour n'en retenir que 12 — un ratio examinés/retournés de
**41,7**.

## Après index — IXSCAN

```json
{
  "winningPlan": {
    "stage": "FETCH",
    "inputStage": {
      "stage": "IXSCAN",
      "indexName": "status_1_restaurant_id_1",
      "keyPattern": { "status": 1, "restaurant_id": 1 },
      "indexBounds": {
        "status": ["[\"CONFIRMED\", \"CONFIRMED\"]"],
        "restaurant_id": ["[ObjectId(6a2feaba46b300b4a537ec97), ObjectId(6a2feaba46b300b4a537ec97)]"]
      }
    }
  }
}
```

| Métrique | Valeur |
|---|---|
| Stage gagnant | `FETCH` ← `IXSCAN` |
| Documents examinés (`totalDocsExamined`) | **12** |
| Clés d'index examinées (`totalKeysExamined`) | 12 |
| Documents retournés (`nReturned`) | 12 |
| Seeks dans l'index | 1 |

Avec l'index composé, MongoDB localise directement les 12 documents
pertinents via l'index (`IXSCAN`), puis va chercher (`FETCH`) uniquement
ces 12 documents sur disque — un ratio examinés/retournés de **1**.

## Analyse

- **Sans index** : `docsExamined` = taille totale de la collection,
  indépendamment de la sélectivité de la requête. Le coût croît
  linéairement avec le nombre de commandes — inacceptable en production
  dès que la collection dépasse quelques milliers de documents.
- **Avec index** : `docsExamined` = `nReturned` (1 document examiné par
  document retourné). Le coût ne dépend plus de la taille de la
  collection mais de la sélectivité du filtre.
- L'ordre des champs de l'index (`status` puis `restaurant_id`) a été
  choisi car ce couple est interrogé conjointement sur les routes les
  plus fréquentes (tableau de bord restaurant : commandes actives d'un
  restaurant donné) — voir `src/models/Commande.js` et
  `scripts/indexes/create-indexes.js` pour la justification complète des
  index de cette collection.

## Reproduire la mesure

```bash
# 1. Peupler la collection commandes (si vide) avec npm run demo:seed-orders
#    ou un jeu de test équivalent.

# 2. Capturer le plan sans index
mongosh "$MONGODB_URI" --eval '
  db.commandes.dropIndex("status_1_restaurant_id_1");
  printjson(db.commandes.find({status:"CONFIRMED", restaurant_id: ObjectId("...")}).explain("executionStats"));
'

# 3. Recréer l'index et capturer le plan avec index
mongosh "$MONGODB_URI" --eval '
  db.commandes.createIndex({ status: 1, restaurant_id: 1 }, { name: "status_1_restaurant_id_1" });
  printjson(db.commandes.find({status:"CONFIRMED", restaurant_id: ObjectId("...")}).explain("executionStats"));
'
```

Le script `scripts/demo/soutenance-live.js` (commande `npm run
demo:mongosh`) automatise une démonstration équivalente pour la
soutenance orale.
