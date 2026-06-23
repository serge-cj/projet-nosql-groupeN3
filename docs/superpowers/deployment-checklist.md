# Render Deployment Checklist for Libreville Eats

This checklist is intended for presentation deployment: both frontend and backend are hosted on Render, with MongoDB Atlas as the database.

## 1. Préparer le projet localement

- [ ] Installer les dépendances backend et frontend
  ```bash
  npm install
  npm --prefix frontend install
  ```
- [ ] Vérifier la construction du frontend
  ```bash
  npm --prefix frontend run build
  ```
- [ ] Tester localement le backend
  ```bash
  export MONGODB_URI='mongodb://localhost:27017/libreville_eats'
  export JWT_SECRET='dev-secret'
  npm run dev
  ```
- [ ] Exécuter les tests
  ```bash
  npm test
  npm --prefix frontend test
  ```

## 2. Préparer les variables d'environnement sur Render

### Backend service
- `MONGODB_URI` = Atlas connection string
- `JWT_SECRET` = strong secret
- `API_BASE_URL` = `https://<backend-service>.onrender.com` (recommended)
- `FRONTEND_URLS` = `https://<frontend-service>.onrender.com`
- `FRONTEND_URL` = `https://<frontend-service>.onrender.com`
- Optionnel: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

### Frontend service
- `NEXT_PUBLIC_API_URL` = `https://<backend-service>.onrender.com/api`
- Optionnel: `NEXT_PUBLIC_SOCKET_URL` = `wss://<backend-service>.onrender.com`
- Optionnel: `NEXT_PUBLIC_SITE_URL` = `https://<frontend-service>.onrender.com`

## 3. Créer le service Backend sur Render

- New Web Service → Repository: this repo
- Root Directory: `/` (repo root)
- Build Command: `npm install`
- Start Command: `npm start`
- Environment: Node 20+
- Env vars: `MONGODB_URI`, `JWT_SECRET`, `API_BASE_URL`, `FRONTEND_URLS`, optional Redis vars

## 4. Créer le service Frontend sur Render

- New Web Service → Repository: this repo
- Root Directory: `frontend/`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`
- Environment: Node 20+
- Env vars: `NEXT_PUBLIC_API_URL`, optional `NEXT_PUBLIC_SOCKET_URL`, optional `NEXT_PUBLIC_SITE_URL`

## 5. Vérification post-déploiement

- Vérifier la santé du backend
  ```bash
  curl -sS https://<backend-service>.onrender.com/health
  ```
- Ouvrir l’URL frontend et vérifier que l’interface charge
- Exécuter un flux de commande simple et confirmer la création dans MongoDB Atlas
- Vérifier l’absence d’erreurs CORS dans la console du navigateur

## 6. Optionnel : activer Redis pour Socket.io

- Provisionner Redis (Render addon ou autre fournisseur)
- Configurer sur Render:
  - `REDIS_HOST`
  - `REDIS_PORT`
  - `REDIS_PASSWORD`
- Backend détecte Redis et active l’adaptateur Socket.io si disponible

## 7. Commit et tag

- Commit des changements de configuration non sensibles:
  ```bash
  git add .
  git commit -m "chore: deployment-ready for Render presentation"
  git tag v1.0-presentation
  git push --follow-tags
  ```

## 8. Repli et dépannage rapide

- Voir les logs Render depuis le dashboard du service
- Déployer un commit précédent depuis Render si nécessaire
- Revenir localement et pousser une correction:
  ```bash
  git revert <bad-commit>
  git push
  ```

## 9. Points de contrôle de présentation

- Backend `/health` répond `status: ok`
- Frontend charge sans erreurs réseau
- Flux de commande fonctionne
- Données apparaissent dans Atlas
- Secrets non commités dans le repo
