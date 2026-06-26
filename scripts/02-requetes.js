// scripts/02-requetes.js
// Nous illustrons ici des requêtes avancées — filtres ($gt, $lt, $in), expressions régulières,
// tri (sort), pagination (skip / limit) et comptage (countDocuments).
// Nous exécutons ce script de manière autonome avec mongosh. Usage :
//   load("data/seed.js")
//   load("scripts/02-requetes.js")

print('\n=== 02-requetes.js ===\n');

// ---------- Filtres $gt / $lt : nous comparons des valeurs numériques ----------
print('--- Commandes dont le total dépasse 5000 FCFA ---');
db.commandes.find({ 'pricing.total': { $gt: 5000 } }, { 'pricing.total': 1, status: 1 }).forEach(printjson);

print('\n--- Restaurants notés en dessous de 4.3 ---');
db.restaurants.find({ rating: { $lt: 4.3 } }, { name: 1, rating: 1 }).forEach(printjson);

// ---------- Filtre $in : nous sélectionnons les documents dont une valeur appartient à un ensemble ----------
print('\n--- Commandes actives (statuts non terminaux) ---');
db.commandes
  .find({ status: { $in: ['PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERY_IN_PROGRESS'] } }, { status: 1 })
  .forEach(printjson);

// ---------- Expression régulière : nous filtrons par motif textuel ----------
print('\n--- Restaurants dont le nom contient "Gabon" ou "Albert" (insensible à la casse) ---');
db.restaurants.find({ name: { $regex: /gabon|albert/i } }, { name: 1 }).forEach(printjson);

print('\n--- Clients dont l\'email est un compte Gmail ---');
db.users.find({ email: { $regex: /@gmail\.com$/ } }, { email: 1, role: 1 }).forEach(printjson);

// ---------- Tri (sort) : nous ordonnons les résultats ----------
print('\n--- Restaurants triés par note décroissante ---');
db.restaurants.find({}, { name: 1, rating: 1 }).sort({ rating: -1 }).forEach(printjson);

print('\n--- Commandes triées par date de création (plus récentes en premier) ---');
db.commandes.find({}, { 'metadata.createdAt': 1, status: 1 }).sort({ 'metadata.createdAt': -1 }).forEach(printjson);

// ---------- Pagination (skip / limit) : nous découpons les résultats en pages ----------
print('\n--- Pagination : page 1 (2 résultats) des commandes triées par date ---');
db.commandes
  .find({}, { 'pricing.total': 1, status: 1 })
  .sort({ 'metadata.createdAt': 1 })
  .skip(0)
  .limit(2)
  .forEach(printjson);

print('\n--- Pagination : page 2 (2 résultats suivants) ---');
db.commandes
  .find({}, { 'pricing.total': 1, status: 1 })
  .sort({ 'metadata.createdAt': 1 })
  .skip(2)
  .limit(2)
  .forEach(printjson);

// ---------- Comptage : nous dénombrons les documents correspondant à un filtre ----------
print('\n--- Comptage : nombre total de restaurants ouverts ---');
print(db.restaurants.countDocuments({ isOpen: true }));

print('\n--- Comptage : nombre de commandes actives (statuts non terminaux) ---');
print(db.commandes.countDocuments({ status: { $in: ['PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERY_IN_PROGRESS'] } }));

print('\n=== Fin 02-requetes.js ===\n');
