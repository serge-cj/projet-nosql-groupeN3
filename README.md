<<<<<<< HEAD
# Libreville Eats — Backend API

API REST pour **Libreville Eats**, application de livraison de repas à domicile à Libreville (projet NoSQL — Master I, Groupe 3).

Stack : **Node.js**, **Express**, **Mongoose**, **MongoDB**, **Redis** (cache), **JWT**.

---

## Structure du projet

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
```

---

## Installation

```bash
git clone https://github.com/votre-org/Libreville-Eats-Backend.git
cd Libreville-Eats-Backend
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

---

## API (endpoints principaux)

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion JWT |
| GET | `/api/restaurants` | Liste des restaurants |
| GET | `/api/restaurants/nearby` | Restaurants à proximité |
| POST | `/api/orders` | Créer une commande |
| GET | `/api/orders/:id` | Détail et suivi de commande |
| GET | `/api/deliverers` | Liste des livreurs disponibles |

---

## Variables d'environnement

Voir `.env.example` :

- `MONGODB_URI` — connexion MongoDB (local ou Atlas), base `libreville_eats`
- `JWT_SECRET` — clé de signature des jetons
- `REDIS_HOST` / `REDIS_PORT` — cache Redis (optionnel)

---

## Documentation de conception

- `docs/design/PHASE1_NOSQL_MODELING.md` — modèle document MongoDB
- `docs/design/PHASE1_REDIS_CACHING.md` — stratégie Redis
- `scripts/demo/SOUTENANCE_MONGOSH.md` — guide démo mongosh

---

Projet réalisé dans le cadre du module **Bases de données NoSQL** — **Libreville Eats** (Groupe 3).
