// scripts/04-index.js
// Indexation et performance — createIndex(), explain('executionStats').
// Objectif : comparer les performances avant et après création d'index.
// Repris de scripts/indexes/create-indexes.js (utilisé par l'app réelle via
// Mongoose), ici en mongosh pur.
//
// Script mongosh autonome. Usage :
//   load("data/seed.js")
//   load("scripts/04-index.js")

print('\n=== 04-index.js ===\n');

// ---------- Requête de référence : commandes CONFIRMED d'un restaurant ----------
const sampleRestaurant = db.restaurants.findOne({});
const query = { status: 'CONFIRMED', restaurant_id: sampleRestaurant._id };

print('--- Plan AVANT création de l\'index composé (COLLSCAN attendu) ---');
try {
  db.commandes.dropIndex('idx_status_restaurant');
} catch (e) {
  print('(pas d\'index existant à supprimer — premier passage)');
}
const before = db.commandes.find(query).explain('executionStats');
print('Stage gagnant : ' + before.executionStats.executionStages.stage);
printjson({
  totalDocsExamined: before.executionStats.totalDocsExamined,
  totalKeysExamined: before.executionStats.totalKeysExamined,
  nReturned: before.executionStats.nReturned,
});

print('\n--- Création des index ---');

// Authentification & lookups
db.users.createIndex({ email: 1 }, { unique: true, name: 'idx_email_unique' });
print('OK : users.email (unique)');

// Géospatial
db.users.createIndex({ 'addresses.coordinates': '2dsphere' });
db.restaurants.createIndex({ 'address.coordinates': '2dsphere' });
db.deliverers.createIndex({ currentLocation: '2dsphere' });
db.commandes.createIndex({ 'deliveryTracking.coordinates': '2dsphere' });
print('OK : index géospatiaux (2dsphere) sur users, restaurants, deliverers, commandes');

// Composé : restaurants par quartier + ouverture
db.restaurants.createIndex({ 'address.district': 1, isOpen: 1 }, { name: 'idx_district_open' });
print('OK : restaurants.address.district + isOpen (composé)');

// Texte (recherche plein-texte pondérée)
db.restaurants.createIndex(
  { name: 'text', 'menus.name': 'text', 'menus.dishes.name': 'text', 'menus.dishes.description': 'text' },
  { name: 'idx_text_search', weights: { name: 10, 'menus.dishes.name': 5, 'menus.name': 3, 'menus.dishes.description': 1 } },
);
print('OK : restaurants — index texte pondéré');

// Composé : commandes par statut + restaurant (CRITIQUE — tableau de bord vendeur)
db.commandes.createIndex({ status: 1, restaurant_id: 1 }, { name: 'idx_status_restaurant' });
print('OK : commandes.status + restaurant_id (composé) — CRITIQUE');

// Composé : historique client trié par date
db.commandes.createIndex({ customer_id: 1, 'metadata.createdAt': -1 }, { name: 'idx_customer_date' });
print('OK : commandes.customer_id + metadata.createdAt DESC (composé)');

// Composé : suivi des livraisons par livreur
db.commandes.createIndex({ deliverer_id: 1, status: 1 }, { name: 'idx_deliverer_status' });
print('OK : commandes.deliverer_id + status (composé)');

// Composé : disponibilité des livreurs
db.deliverers.createIndex({ isAvailable: 1, isActive: 1 }, { name: 'idx_available' });
print('OK : deliverers.isAvailable + isActive (composé)');

// ---------- Plan APRÈS création de l'index composé (IXSCAN attendu) ----------
print('\n--- Plan APRÈS création de l\'index composé (IXSCAN attendu) ---');
const after = db.commandes.find(query).explain('executionStats');
const winningStage = after.queryPlanner.winningPlan.inputStage
  ? after.queryPlanner.winningPlan.inputStage.stage
  : after.queryPlanner.winningPlan.stage;
print('Stage gagnant : ' + winningStage);
printjson({
  totalDocsExamined: after.executionStats.totalDocsExamined,
  totalKeysExamined: after.executionStats.totalKeysExamined,
  nReturned: after.executionStats.nReturned,
});

print('\n--- Comparaison ---');
printjson({
  avant: { stage: 'COLLSCAN', docsExamines: before.executionStats.totalDocsExamined },
  apres: { stage: winningStage, docsExamines: after.executionStats.totalDocsExamined },
});

print('\nVoir explain/explain-avant-apres.pdf pour l\'analyse détaillée sur le jeu de données complet.');
print('\n=== Fin 04-index.js ===\n');
