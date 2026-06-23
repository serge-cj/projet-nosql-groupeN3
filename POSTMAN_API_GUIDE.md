# Guide API Libreville Eats - Tests API

## 🎯 Objectif
Ce guide te montre comment tester l’API Libreville Eats avec Postman, Thunder Client et `curl`, étape par étape. Tu trouveras des exemples de requêtes, des en-têtes à utiliser et les réponses attendues.

---

## 🔧 Préparation

### 1. Démarrer le serveur
Ouvre un terminal à la racine du projet et exécute :

```bash
npm install
npm run dev
```

Si le port `5000` est déjà utilisé, change-le ainsi :

```bash
PORT=5001 npm run dev
```

### 2. URL de base
Utilise l’URL de base suivante pour toutes les requêtes :
- `http://localhost:5000`

Si tu as changé de port, utilise `http://localhost:5001` ou le port choisi.

Dans Postman/Thunder Client, crée une variable d’environnement :
- `baseUrl = http://localhost:5000`

### 3. En-têtes utiles
Pour toutes les requêtes `POST` ou `PUT`, ajoute :
- `Content-Type: application/json`

Pour les routes protégées, ajoute également :
- `Authorization: Bearer <TON_JWT_TOKEN>`

---

## 🧪 Tester avec `curl`

`curl` est parfait pour tester rapidement l’API depuis la ligne de commande.

- Inscription :
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"client@example.com",
    "password":"Password123",
    "profile":{
      "firstName":"Jean",
      "lastName":"Dupont",
      "phone":"+24101234567"
    },
    "role":"CUSTOMER"
  }'
```

- Connexion :
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"client@example.com",
    "password":"Password123"
  }'
```

- Requête protégée avec token :
```bash
curl http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer <TON_TOKEN>"
```

> Remplace `<TON_TOKEN>` par le token JWT reçu après la connexion.

---

## ⚡ Tester avec Thunder Client

Thunder Client est un excellent outil intégré à VS Code pour tester les API.

1. Ouvre la section Thunder Client dans VS Code.
2. Crée une collection ou un environnement.
3. Ajoute `baseUrl` comme variable d’environnement.
4. Copie les en-têtes `Content-Type` et `Authorization` dans chaque requête.
5. Enregistre chaque requête pour rejouer facilement le parcours.

Tu peux utiliser les mêmes URLs et corps JSON que dans ce guide.

---

## 💡 Conseils généraux

- Teste d’abord `POST /api/auth/register` puis `POST /api/auth/login`.
- Copie le token JWT et utilise-le pour les requêtes protégées.
- Vérifie toujours le code HTTP (`200`, `201`, `400`, `401`, `404`).
- En cas d’erreur, lis le message retourné par l’API pour comprendre le champ invalide.

---

## 🔐 Étape 1 : Inscription

### But
Créer un compte utilisateur pour accéder aux routes sécurisées.

### Requête
- Méthode : `POST`
- URL : `{{baseUrl}}/api/auth/register`

### En-têtes
- `Content-Type: application/json`

### Corps (body)
```json
{
  "email": "client@example.com",
  "password": "Password123",
  "profile": {
    "firstName": "Jean",
    "lastName": "Dupont",
    "phone": "+24101234567"
  },
  "role": "CUSTOMER"
}
```

### Ce que fait la requête
L’API vérifie que :
- ton email est valide,
- ton mot de passe contient au moins 8 caractères,
- le prénom et le nom sont présents,
- le téléphone correspond au format gabonais `+24112345678`.

Si c’est bon, elle enregistre l’utilisateur et renvoie un token JWT.

### Résultat attendu
- Code HTTP : `201`
- Réponse : un objet avec `user` et `token`

Si la réponse renvoie une erreur, relis le message d’erreur : il indique quel champ est invalide.

---

## 🔐 Étape 2 : Connexion

### But
Obtenir le token JWT à utiliser pour les prochaines requêtes.

### Requête
- Méthode : `POST`
- URL : `{{baseUrl}}/api/auth/login`

### En-têtes
- `Content-Type: application/json`

### Corps
```json
{
  "email": "client@example.com",
  "password": "Password123"
}
```

### Ce que fait la requête
L’API vérifie ton email et ton mot de passe. Si tout est correct, elle renvoie un token JWT.

### Résultat attendu
- Code HTTP : `200`
- Réponse : un objet avec `user` et `token`

> Si tu reçois `401`, vérifie ton email et ton mot de passe.

---

## ✅ Étape 3 : Ajouter le token JWT

Dans Postman, copie la valeur `token` reçue après le login.

Ajoute un header dans toutes les requêtes protégées :
- Key : `Authorization`
- Value : `Bearer <TON_TOKEN>`

Cette étape est indispensable pour accéder aux routes qui demandent une authentification.

---

## 👤 Étape 4 : Voir ton profil

### But
Vérifier que ton token fonctionne et récupérer les informations de ton compte.

### Requête
- Méthode : `GET`
- URL : `{{baseUrl}}/api/users/profile`

### En-têtes
- `Authorization: Bearer <TON_TOKEN>`

### Ce que fait la requête
L’API lit le token, identifie l’utilisateur et renvoie son profil.

### Résultat attendu
- Code HTTP : `200`
- Réponse : un objet contenant les informations de l’utilisateur connecté

Exemple :
```json
{
  "user": {
    "_id": "...",
    "email": "client@example.com",
    "role": "CUSTOMER",
    "profile": {
      "firstName": "Jean",
      "lastName": "Dupont",
      "phone": "+24101234567"
    }
  }
}
```

---

## ✏️ Étape 5 : Mettre à jour ton profil

### But
Changer ton nom, ton téléphone ou ajouter une adresse.

### Requête
- Méthode : `PUT`
- URL : `{{baseUrl}}/api/users/profile`

### En-têtes
- `Authorization: Bearer <TON_TOKEN>`
- `Content-Type: application/json`

### Corps
```json
{
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
}
```

### Ce que fait la requête
L’API met à jour les informations du compte connecté.

### Résultat attendu
- Code HTTP : `200`
- Réponse : les données utilisateur mises à jour

---

## 🍽️ Étape 6 : Lister les restaurants

### But
Voir les restaurants disponibles dans l’application.

### Requête
- Méthode : `GET`
- URL : `{{baseUrl}}/api/restaurants`

### Ce que fait la requête
L’API renvoie la liste de tous les restaurants présents dans la base de données.

### Résultat attendu
- Code HTTP : `200`
- Réponse : un tableau `restaurants`

Exemple simplifié :
```json
{
  "restaurants": [
    {
      "_id": "...",
      "name": "Le Gourmet Gabonais",
      "address": {
        "district": "Nombakélé",
        "city": "Libreville"
      },
      "isOpen": true
    }
  ]
}
```

---

## 📍 Étape 7 : Voir un restaurant précis

### But
Obtenir les détails d’un restaurant en particulier.

### Requête
- Méthode : `GET`
- URL : `{{baseUrl}}/api/restaurants/:id`

### Remplace
- `:id` par l’identifiant du restaurant obtenu dans la liste.

### Résultat attendu
- Code HTTP : `200`
- Réponse : un objet `restaurant`

---

## 🧾 Étape 8 : Créer une commande

### But
Passer une commande depuis ton compte.

### Requête
- Méthode : `POST`
- URL : `{{baseUrl}}/api/orders`

### En-têtes
- `Authorization: Bearer <TON_TOKEN>`
- `Content-Type: application/json`

### Corps
```json
{
  "restaurantId": "6123abcd4567ef8901234567",
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
}
```

### Ce que fait la requête
L’API vérifie tes informations, crée une nouvelle commande et te renvoie les détails de cette commande.

### Résultat attendu
- Code HTTP : `201`
- Réponse : un objet `order` créé

---

## 📦 Étape 9 : Lister tes commandes

### But
Voir toutes tes commandes en tant qu’utilisateur connecté.

### Requête
- Méthode : `GET`
- URL : `{{baseUrl}}/api/orders`

### En-têtes
- `Authorization: Bearer <TON_TOKEN>`

### Résultat attendu
- Code HTTP : `200`
- Réponse : un tableau `orders`

---

## 🔎 Étape 10 : Voir une commande précise

### But
Consulter le détail d’une commande existante.

### Requête
- Méthode : `GET`
- URL : `{{baseUrl}}/api/orders/:id`

### Remplace
- `:id` par l’identifiant de la commande.

### Résultat attendu
- Code HTTP : `200`
- Réponse : un objet `order` détaillé

---

## 🚴 Étape 11 : Voir les livreurs

### But
Vérifier la liste des livreurs disponibles dans l’application.

### Requête
- Méthode : `GET`
- URL : `{{baseUrl}}/api/deliverers`

### Résultat attendu
- Code HTTP : `200`
- Réponse : un tableau `deliverers`

---

## 🧩 Notes importantes

- `POST /api/auth/register` : créer un compte
- `POST /api/auth/login` : récupérer le token JWT
- `GET /api/users/profile` : vérifier que l’authentification fonctionne
- `GET /api/restaurants` : tester une route publique
- `POST /api/orders` : créer une commande
- `GET /api/orders` : lister tes commandes

### Si tu as une erreur
- `400` : données invalides dans le body
- `401` : token manquant ou invalide
- `404` : URL ou ID incorrect

---

## 🧪 Parcours de test recommandé

1. `POST {{baseUrl}}/api/auth/register`
2. `POST {{baseUrl}}/api/auth/login`
3. Copier le token
4. `GET {{baseUrl}}/api/users/profile`
5. `GET {{baseUrl}}/api/restaurants`
6. `GET {{baseUrl}}/api/restaurants/:id`
7. `POST {{baseUrl}}/api/orders`
8. `GET {{baseUrl}}/api/orders`
9. `GET {{baseUrl}}/api/orders/:id`

> Si tu utilises un port différent, remplace `{{baseUrl}}` par l’adresse correspondante.
