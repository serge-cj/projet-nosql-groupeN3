# api/ (bonus optionnel)

Le bonus API REST Node.js/Express/Mongoose/MongoDB demandé par le sujet **n'est pas dupliqué dans ce dossier** : il constitue le cœur réel du dépôt, déjà en place à la racine du projet.

- Entrée du serveur : [`src/server.js`](../src/server.js)
- Routes REST : [`src/routes/`](../src/routes/)
- Contrôleurs (logique métier) : [`src/controllers/`](../src/controllers/)
- Connexion MongoDB/Redis : [`src/config/`](../src/config/)
- Modèles Mongoose (`User`, `Restaurant`, `Commande`, `Deliverer`) : [`src/models/`](../src/models/)

## Fonctionnalités couvertes

- **CRUD** complet sur restaurants, menus, commandes, utilisateurs, livreurs (`src/routes/`, `src/controllers/`).
- **Routes REST** versionnées sous `/api/...` (authentification, restaurants, commandes, livreurs) — voir le tableau des endpoints dans le [README racine](../README.md#api-endpoints-principaux).
- **Connexion à MongoDB** via Mongoose (`src/config/database.js`), avec cache Redis optionnel devant les lectures fréquentes (`src/services/cacheService.js`).

## Lancer l'API

```bash
npm install
cp .env.example .env   # éditer MONGODB_URI
npm run seed            # peupler la base (données gabonaises)
npm run dev              # démarre l'API sur le port 5000
```

Voir le [README racine](../README.md) pour la liste complète des commandes (tests, lint, agrégations, index).
