# Libreville Eats - Projet NoSQL (Groupe 3)

Application de livraison de repas à domicile à Libreville, réalisée dans le cadre du module **Bases de données NoSQL** (Master 1).

## Membres du groupe

- BOUKINDA MAMBOUNDOU Jude
- MAVOUNGOU Serge Murlain
- BENOME NTOUTOUME Élise Josita

## Contexte métier

Libreville Eats connecte trois types d'utilisateurs autour d'une commande : un **client** qui parcourt les restaurants et commande, un **restaurateur** qui gère son menu et confirme les commandes, et un **livreur** dont la position GPS est suivie en temps réel jusqu'à la livraison. Les contraintes locales (connectivité mobile variable, données gabonaises réalistes : quartiers de Libreville, plats, FCFA) ont guidé les choix de modélisation NoSQL — voir `conception/modele-donnees.md` pour le détail.

Ce dépôt couvre l'intégralité du socle attendu pour le projet NoSQL (modélisation, scripts CRUD/requêtes/agrégations, indexation, analyse `explain()`, rapport) **et** va au-delà avec une implémentation complète : une API REST Node.js/Express/MongoDB/Redis fonctionnelle (le bonus `api/` du sujet) accompagnée d'un frontend Next.js de démonstration.

Stack : **Node.js**, **Express**, **Mongoose**, **MongoDB**, **Redis** (cache), **JWT**.

---

## Prérequis

- **Node.js** >= 18
- **MongoDB** (local ou Atlas) — voir `MONGODB_URI` dans `.env.example`
- **mongosh** (pour charger les scripts de `data/` et `scripts/`)
- **Redis** (optionnel — l'API dégrade proprement sans cache si absent)

## Instructions d'exécution (scripts NoSQL)

```bash
mongosh "$MONGODB_URI"
load("data/seed.js")
load("scripts/01-crud.js")
load("scripts/02-requetes.js")
load("scripts/03-agregations.js")
load("scripts/04-index.js")
```

## Structure du dépôt (livrables NoSQL)

```
conception/
├── modele-donnees.pdf      # Collections, schémas, relations, embedding vs referencing
└── schema.png              # Schéma visuel du modèle de données
data/
└── seed.js                  # 30 restaurants réels + 30 clients/30 restaurateurs/30 livreurs (mdp en clair : TestPass123), insertMany() — mongosh pur
scripts/
├── 01-crud.js                # insertOne/insertMany/find/updateOne/updateMany/deleteOne/deleteMany, $set/$inc/$push/$pull
├── 02-requetes.js            # $gt/$lt/$in, regex, sort, pagination (skip/limit), countDocuments
├── 03-agregations.js         # $match / $group / $sort / $lookup
└── 04-index.js                # createIndex(), explain('executionStats')
explain/
└── explain-avant-apres.pdf  # Analyse COLLSCAN vs IXSCAN
rapport/
└── rapport.pdf               # Rapport final (8 sections)
api/
└── README.md                 # Pointe vers le bonus API REST réel : src/
```

Le reste du dépôt — l'application complète qui met ces choix NoSQL en pratique — est organisé ainsi :

```
src/
├── server.js              # Point d'entrée
├── app.js                 # Configuration Express
├── config/                # MongoDB, Redis, variables d'environnement
├── models/                # User, Restaurant, Commande, Deliverer
├── controllers/           # Logique métier
├── routes/                # Routes API REST
├── middleware/            # JWT, validation Zod
└── schemas/               # Validateurs de requêtes

scripts/
├── seed/                  # Données gabonaises de test
├── indexes/               # Création des index MongoDB
├── aggregations/          # Pipelines d'agrégation (soutenance)
└── demo/                  # Scripts mongosh (démo live)

docs/design/               # Conception NoSQL + Redis
tests/                     # Tests Jest + Supertest

frontend/                  # Frontend Next.js 14 (démonstration de l'API)
├── app/                   # App Router (restaurants, dashboards client/restaurateur/livreur, auth, admin)
├── lib/                   # Client API (axios), gestion du panier
└── tokens.css             # Design system (tokens CSS)
```

---

## Installation

```bash
git clone https://github.com/votre-org/Libreville-Eats-Backend.git
cd projet-nosql-groupeN3-Backend
npm install
cp .env.example .env   # puis éditer MONGODB_URI, JWT_SECRET
```

---

## Lancement

```bash
npm run dev          # Serveur de développement (port 5000)
npm run seed         # Peupler la base (données gabonaises)
npm run indexes      # Créer/vérifier les index MongoDB
npm test             # Tests unitaires
```

### Scripts utiles (soutenance)

```bash
npm run demo:seed-orders    # 45 commandes de démo
npm run demo:mongosh        # Démo agrégation + explain()
npm run aggregate:all       # Tous les pipelines d'agrégation
npm run seed:clean          # Vider les collections
```

### Frontend (démonstration)

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:5001/api" > .env.local
npm run dev                        # http://localhost:3000
```

---

## API (endpoints principaux)

| Méthode | Route                     | Description                    |
| ------- | ------------------------- | ------------------------------ |
| POST    | `/api/auth/register`      | Inscription                    |
| POST    | `/api/auth/login`         | Connexion JWT                  |
| GET     | `/api/restaurants`        | Liste des restaurants          |
| GET     | `/api/restaurants/nearby` | Restaurants à proximité        |
| POST    | `/api/orders`             | Créer une commande             |
| GET     | `/api/orders/:id`         | Détail et suivi de commande    |
| GET     | `/api/deliverers`         | Liste des livreurs disponibles |

---

## Variables d'environnement

Voir `.env.example` :

- `MONGODB_URI` — connexion MongoDB (local ou Atlas), base `libreville_eats`
- `JWT_SECRET` — clé de signature des jetons
- `REDIS_HOST` / `REDIS_PORT` — cache Redis (optionnel)

---

## Jeu de tests API (bonus)

`.thunder-client/` — collection **Thunder Client** (extension VS Code) couvrant les 26 endpoints de l'API (auth, restaurants, menus/plats, commandes, utilisateurs, livreurs), avec un environnement préconfiguré et la documentation requête/réponse de chaque route. Voir `.thunder-client/README.md` pour l'import et le scénario de bout en bout.

## Documentation de conception

- `conception/modele-donnees.pdf` — livrable NoSQL : modèle document, embedding vs referencing
- `explain/explain-avant-apres.pdf` — livrable NoSQL : COLLSCAN vs IXSCAN
- `rapport/rapport.pdf` — livrable NoSQL : rapport final
- `docs/design/PHASE1_NOSQL_MODELING.md` — version détaillée du modèle document MongoDB (application réelle)
- `docs/design/PHASE1_REDIS_CACHING.md` — stratégie Redis
- `scripts/demo/SOUTENANCE_MONGOSH.md` — guide démo mongosh

---

Projet réalisé dans le cadre du module **Bases de données NoSQL** — **Libreville Eats** (Groupe 3).

# projet-nosql-groupeN3
