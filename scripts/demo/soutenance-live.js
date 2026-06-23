/**
 * Script mongosh — démo soutenance (5 min)
 *
 * Prérequis:
 *   npm run seed
 *   node scripts/demo/seed-commandes-demo.js
 *
 * Lancement:
 *   mongosh "mongodb://localhost:27017/libreville_eats" --file scripts/demo/soutenance-live.js
 *
 * Ou dans mongosh déjà connecté:
 *   load('scripts/demo/soutenance-live.js')
 */

const DB_NAME = 'libreville_eats';
use(DB_NAME);

function hr(title) {
  print('\n' + '='.repeat(60));
  print(title);
  print('='.repeat(60));
}

function findStage(stages, target) {
  if (!stages) return null;
  if (stages.stage === target) return stages;
  if (stages.inputStage) return findStage(stages.inputStage, target);
  if (stages.inputStages) {
    for (const s of stages.inputStages) {
      const found = findStage(s, target);
      if (found) return found;
    }
  }
  return null;
}

function summarizeExplain(label, plan) {
  const stats = plan.executionStats;
  const collscan = findStage(stats.executionStages, 'COLLSCAN');
  const ixscan = findStage(stats.executionStages, 'IXSCAN');

  print(`\n--- ${label} ---`);
  print(`  stage racine     : ${stats.executionStages.stage}`);
  print(`  docs examinés    : ${stats.totalDocsExamined}`);
  print(`  clés examinées   : ${stats.totalKeysExamined}`);
  print(`  COLLSCAN         : ${collscan ? 'OUI (scan complet)' : 'non'}`);
  print(`  IXSCAN           : ${ixscan ? 'OUI (index utilisé)' : 'non'}`);
  print(`  temps (ms)       : ${stats.executionTimeMillis}`);

  return { collscan: !!collscan, ixscan: !!ixscan };
}

// ─────────────────────────────────────────────────────────────
// PARTIE 1 — Agrégation $lookup (CA par restaurant, Libreville)
// Durée suggérée: ~2 min 30
// ─────────────────────────────────────────────────────────────
hr('PARTIE 1 — Agrégation $lookup : CA par restaurant');

const orderCount = db.commandes.countDocuments();
print(`\nCollection commandes: ${orderCount} documents`);

if (orderCount === 0) {
  print('\n⚠️  Aucune commande. Exécutez: node scripts/demo/seed-commandes-demo.js\n');
} else {
  const pipeline = [
    {
      $match: {
        status: { $nin: ['CANCELLED', 'FAILED'] },
      },
    },
    {
      $group: {
        _id: '$restaurant_id',
        commandes: { $sum: 1 },
        caFcfa: { $sum: '$pricing.total' },
        panierMoyen: { $avg: '$pricing.total' },
        livrees: {
          $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] },
        },
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
      $match: {
        'restaurant.address.city': 'Libreville',
      },
    },
    {
      $project: {
        _id: 0,
        restaurant: '$restaurant.name',
        quartier: '$restaurant.address.district',
        commandes: 1,
        caFcfa: 1,
        panierMoyen: { $round: ['$panierMoyen', 0] },
        livrees: 1,
      },
    },
    { $sort: { caFcfa: -1 } },
    { $limit: 10 },
  ];

  print('\nPipeline: $match → $group → $lookup → $unwind → $match → $project → $sort\n');

  const stats = db.commandes.aggregate(pipeline).toArray();
  print(`Résultats (${stats.length} restaurants):\n`);
  printjson(stats);
}

// ─────────────────────────────────────────────────────────────
// PARTIE 2 — explain() avant / après index composé
// Durée suggérée: ~2 min 30
// ─────────────────────────────────────────────────────────────
hr('PARTIE 2 — explain() : COLLSCAN → IXSCAN');

const sampleRestaurant = db.restaurants.findOne({}, { _id: 1, name: 1 });
const demoQuery = {
  status: 'PREPARING',
  restaurant_id: sampleRestaurant._id,
};

print(`\nRequête métier: commandes en PREPARING pour un restaurant`);
print(`Restaurant: ${sampleRestaurant.name}`);
print(`Filtre: status=PREPARING, restaurant_id=${sampleRestaurant._id}\n`);

const INDEX_NAMES = ['idx_status_restaurant', 'status_1_restaurant_id_1'];
const INDEX_SPEC = { status: 1, restaurant_id: 1 };

print('Étape A — Suppression des index composés existants...');
for (const name of INDEX_NAMES) {
  try {
    db.commandes.dropIndex(name);
    print(`  Index "${name}" supprimé.`);
  } catch (e) {
    print(`  "${name}" : absent.`);
  }
}

const before = summarizeExplain(
  'AVANT index (COLLSCAN forcé via $natural)',
  db.commandes.find(demoQuery).hint({ $natural: 1 }).explain('executionStats')
);

print('\nÉtape B — Création index composé { status: 1, restaurant_id: 1 }...');
db.commandes.createIndex(INDEX_SPEC, { name: 'idx_status_restaurant' });
print('  Index "idx_status_restaurant" créé.');

const after = summarizeExplain(
  'APRÈS index (IXSCAN via index composé)',
  db.commandes.find(demoQuery).hint(INDEX_SPEC).explain('executionStats')
);

hr('SYNTHÈSE');
print(`  COLLSCAN avant  : ${before.collscan ? 'oui ✓' : 'non (peu de docs ?)'}`);
print(`  IXSCAN après    : ${after.ixscan ? 'oui ✓' : 'non ✗'}`);
print(`  docs avant      : ${before.collscan ? 'toute la collection' : '—'}`);
print(`  clés après      : ${after.ixscan ? 'seulement les correspondances' : '—'}`);
print('\n💡 Phrase clé pour le jury:');
print('   "L\'index composé {status, restaurant_id} cible la requête');
print('    des commandes actives par restaurant — pattern d\'accès temps réel."\n');
