# Phase 1.3 : Initialisation du Projet

## Objectif
- Configurer l'environnement de développement
- Initialiser le cluster MongoDB Atlas
- Structurer le projet pour évolutivité

---

## 1. Prérequis Installés

- **Node.js 18+** ✅
- **MongoDB Compass** (GUI) ✅
- **Postman** ou **Thunder Client** (API testing)
- **Git** ✅
- **VS Code** ✅

---

## 2. MongoDB Atlas Setup (Tier Gratuit M0)

### Étape 2.1 : Créer le Cluster

1. Aller sur [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Créer un compte gratuit / se connecter
3. **Créer un cluster** :
   - Tier : **M0 (Free)** ✅
   - Provider : AWS
   - Region : **Europe (Frankfurt)** ou **Africa (South Africa)** (plus proche Gabon)
4. **Username/Password** :
   - Username : `libreville_eats_user`
   - Password : Générer et sauvegarder dans `.env`

### Étape 2.2 : Configuration Réseau

1. **IP Whitelist** : Ajouter `0.0.0.0/0` (pour dev local; restreindre en prod)
2. **Connection String** :
   ```
   mongodb+srv://libreville_eats_user:PASSWORD@cluster0.abcd1234.mongodb.net/libreville_eats?retryWrites=true&w=majority
   ```
3. Copier et sauvegarder dans `.env` :
   ```
   MONGODB_ATLAS_URI=mongodb+srv://libreville_eats_user:PASSWORD@cluster0.abcd1234.mongodb.net/libreville_eats?retryWrites=true&w=majority
   ```

### Étape 2.3 : Créer la Base Données

Via **MongoDB Compass** ou shell `mongosh` :

```javascript
use libreville_eats

db.createCollection('users')
db.createCollection('restaurants')
db.createCollection('commandes')
db.createCollection('deliverers')
db.createCollection('favoritesDishes')
```

---

## 3. Variables d'Environnement (`.env`)

Créer `/home/saint_ash/Libreville-Eats-Backend/.env` :

```bash
# MongoDB
MONGODB_LOCAL_URI=mongodb://localhost:27017/libreville_eats
MONGODB_ATLAS_URI=mongodb+srv://libreville_eats_user:YOUR_PASSWORD@cluster0.abcd1234.mongodb.net/libreville_eats?retryWrites=true&w=majority
NODE_ENV=development

# Utiliser Atlas ou local selon besoin
MONGODB_URI=${MONGODB_LOCAL_URI}  # À remplacer par ATLAS pour production

# Redis (local)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Vide pour local sans auth

# API
PORT=5000
API_BASE_URL=http://localhost:5000

# JWT
JWT_SECRET=your_super_secret_key_change_this_in_production_12345
JWT_EXPIRE=7d

# Frontend
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=debug
```

---

## 4. Structure du Projet (Révisée)

```
Libreville-Eats-Backend/
├── src/
│   ├── config/
│   │   ├── database.js        # Connexion MongoDB + Redis
│   │   ├── redis.js           # Config Redis
│   │   └── index.js           # Export centralise
│   │
│   ├── models/
│   │   ├── User.js            # Schema Mongoose valide
│   │   ├── Restaurant.js      # Menus embeds
│   │   ├── Commande.js        # Orders avec statuts
│   │   ├── Deliverer.js       # Livreurs
│   │   └── index.js           # Export
│   │
│   ├── routes/
│   │   ├── auth.js            # Inscription, login, JWT
│   │   ├── restaurants.js     # Menu, recherche, détails
│   │   ├── commandes.js       # Créer, lister, tracker
│   │   ├── deliverers.js      # Gestion livreurs
│   │   ├── users.js           # Profil utilisateur
│   │   └── index.js           # Router principal
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── restaurantController.js
│   │   ├── commandeController.js
│   │   ├── delivererController.js
│   │   └── userController.js
│   │
│   ├── middleware/
│   │   ├── jwtAuth.js         # JWT verification
│   │   └── validateRequest.js # Validation Zod
│   │
│   ├── schemas/
│   │   ├── authValidators.js
│   │   ├── userValidators.js
│   │   └── orderValidators.js
│   │
│   ├── utils/
│   │   ├── logger.js
│   │   └── token.js
│   │
│   ├── app.js                 # Configuration Express
│   └── server.js              # Entrée principale
│
├── scripts/
│   ├── seed/
│   │   ├── data/gabon-data.js # Données gabonaises
│   │   └── index.js           # Orchestrateur
│   │
│   ├── indexes/
│   │   └── create-indexes.js  # Créer tous les indexes
│   │
│   ├── aggregations/          # Pipelines soutenance
│   ├── demo/                  # Scripts mongosh
│   └── cleanup.js             # Vider DB (dev)
│
├── docs/
│   ├── design/
│   │   ├── PHASE1_NOSQL_MODELING.md      ✅ Créé
│   │   ├── PHASE1_REDIS_CACHING.md       ✅ Créé
│   │   ├── PHASE2_SEED_STRATEGY.md       ⏳ À faire
│   │   ├── PHASE3_API_DESIGN.md          ⏳ À faire
│   │   └── ARCHITECTURE_OVERVIEW.md      ⏳ À faire
│   │
│   ├── API_REFERENCE.md       # Swagger/OpenAPI
│   └── SETUP_GUIDE.md         # Guide d'installation
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── .env                       # Variables d'env (local)
├── .env.example              # Template public
├── .gitignore
├── package.json
└── README.md
```

---

## 5. Dépendances à Installer

```bash
npm install express mongoose dotenv cors jsonwebtoken bcryptjs zod pino winston redis nodemailer
npm install -D nodemon jest supertest @types/node
```

### Justification des paquets

| Package | Raison |
|---------|--------|
| `express` | Framework API |
| `mongoose` | ODM MongoDB avec validation |
| `dotenv` | Gestion `.env` |
| `cors` | CORS headers |
| `jsonwebtoken` | JWT tokens |
| `bcryptjs` | Hash passwords |
| `zod` | Validation schemas |
| `pino` | Logging performant |
| `redis` | Client Redis |
| `nodemon` | Auto-reload dev |
| `jest` | Testing framework |

---

## 6. npm Scripts (package.json)

```json
{
  "scripts": {
    "dev": "NODE_ENV=development nodemon src/server.js",
    "start": "NODE_ENV=production node src/server.js",
    "seed": "node scripts/seed/index.js",
    "seed:clean": "node scripts/cleanup.js",
    "indexes": "node scripts/indexes/create-indexes.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "lint": "eslint src/",
    "format": "prettier --write \"src/**/*.js\""
  }
}
```

---

## 7. Configuration Initiale : `.env.example`

Créer [.env.example](.env.example) pour le repo public :

```bash
# Copier et renommer en .env pour dev local

# === MongoDB ===
MONGODB_LOCAL_URI=mongodb://localhost:27017/libreville_eats
MONGODB_ATLAS_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/libreville_eats
MONGODB_URI=${MONGODB_LOCAL_URI}

# === Redis ===
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# === Server ===
NODE_ENV=development
PORT=5000
API_BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

# === JWT ===
JWT_SECRET=CHANGE_THIS_SECRET_KEY_IN_PRODUCTION
JWT_EXPIRE=7d

# === Logging ===
LOG_LEVEL=debug

# === Optional ===
# SENDGRID_API_KEY=
# AWS_S3_BUCKET=
# TWILIO_ACCOUNT_SID=
```

---

## 8. Fichier de Configuration Centralise (`src/config/index.js`)

```javascript
require('dotenv').config();

module.exports = {
  // Database
  mongodb: {
    local: process.env.MONGODB_LOCAL_URI || 'mongodb://localhost:27017/libreville_eats',
    atlas: process.env.MONGODB_ATLAS_URI,
    uri: process.env.MONGODB_URI,
  },
  
  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },
  
  // Server
  server: {
    port: parseInt(process.env.PORT || '5000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:5000',
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-prod',
    expire: process.env.JWT_EXPIRE || '7d',
  },
  
  // Frontend
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};
```

---

## 9. Fichier Principal (`src/server.js`)

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const config = require('./config');

const app = express();

// Middleware
app.use(cors({
  origin: config.frontend.url,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const routes = require('./routes');
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Startup
(async () => {
  try {
    await connectDatabase();
    await connectRedis();
    
    const port = config.server.port;
    app.listen(port, () => {
      logger.info(`🚀 Server running on port ${port}`);
      logger.info(`📡 API: ${config.server.apiBaseUrl}`);
      logger.info(`💾 MongoDB: ${config.mongodb.uri.split('@')[0]}@...`);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
})();

module.exports = app;
```

---

## 10. Checklist Phase 1.3

- [ ] Créer `.env` local avec MongoDB Atlas URI
- [ ] `npm install` toutes les dépendances
- [ ] MongoDB Atlas cluster créé et accessible
- [ ] Redis local ou Redis Cloud configuré
- [ ] Structure de dossiers créée
- [ ] `src/config/index.js` fonctionnel
- [ ] `src/server.js` testé (`npm run dev`)
- [ ] Fichier `.env.example` créé pour le repo

---

## Next Steps

→ **Phase 2.1** : Seed script avec données gabonaises réalistes
