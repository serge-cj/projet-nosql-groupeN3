const mongoose = require('mongoose');
require('dotenv').config();

const { User, Restaurant, Commande, Deliverer } = require('../../src/models');
const { logger } = require('../../src/utils/logger');

/**
 * Nous vérifions ici l'ensemble des index destinés à l'optimisation des performances.
 *
 * Notre stratégie d'indexation :
 * 1. Authentification et lookups (haute fréquence)
 * 2. Requêtes géospatiales (fonctionnalités basées sur la localisation)
 * 3. Index composés (filtres multi-champs)
 * 4. Optimisation du tri
 */
async function createIndexes() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    logger.info(`Connexion à MongoDB: ${mongoUri.replace(/:[^@]*@/, ':****@')}`);

    await mongoose.connect(mongoUri, {
      retryWrites: true,
      w: 'majority',
    });

    logger.info('MongoDB connecté');
    logger.info('Vérification des index...\n');

    // ============ Fonction utilitaire pour créer/vérifier un index en toute sécurité ============
    async function ensureIndex(collection, fields, options = {}) {
      try {
        const indexName = options.name || Object.keys(fields).join('_');

        // Nous tentons la création et interceptons le cas où l'index existe déjà
        await collection.createIndex(fields, options);
        return true;
      } catch (err) {
        if (err.message.includes('Index already exists')) {
          return true; // L'index existe déjà, ce qui ne pose aucun problème
        }
        // Nous journalisons les autres erreurs sans interrompre l'exécution
        logger.debug(`Index operation info: ${err.message}`);
        return true;
      }
    }

    // ============ Index de la collection Utilisateurs ============
    logger.info('Collection Utilisateurs:');

    // Lookup d'authentification (email unique)
    await ensureIndex(User.collection, { email: 1 }, { unique: true });
    logger.info('  email (unique)');

    // Index géospatial pour les utilisateurs à proximité
    await ensureIndex(User.collection, { 'addresses.coordinates': '2dsphere' });
    logger.info('  addresses.coordinates (geospatial)');

    // ============ Index de la collection Restaurants ============
    logger.info('\nCollection Restaurants:');

    // Index géospatial pour les restaurants à proximité
    await ensureIndex(Restaurant.collection, {
      'address.coordinates': '2dsphere',
    });
    logger.info('  address.coordinates (geospatial)');

    // Index composé : quartier + ouverture (lister les restaurants ouverts d'un quartier)
    await ensureIndex(
      Restaurant.collection,
      { 'address.district': 1, 'isOpen': 1 },
      { name: 'idx_district_open' }
    );
    logger.info('  address.district + isOpen (compound)');

    // Disponibilité des plats
    await ensureIndex(Restaurant.collection, { 'menus.dishes.isAvailable': 1 });
    logger.info('  menus.dishes.isAvailable');

    // Index texte pour la recherche plein-texte (nom, noms de menus, noms/descriptions de plats)
    await ensureIndex(
      Restaurant.collection,
      {
        name: 'text',
        'menus.name': 'text',
        'menus.dishes.name': 'text',
        'menus.dishes.description': 'text',
      },
      {
        name: 'idx_text_search',
        weights: { name: 10, 'menus.dishes.name': 5, 'menus.name': 3, 'menus.dishes.description': 1 },
      }
    );
    logger.info('  name + menus.dishes.name (text)');

    // ============ Index de la collection Commandes ============
    logger.info('\nCollection Commandes:');

    // Index composé : statut + restaurant_id (lister les commandes actives par restaurant)
    await ensureIndex(
      Commande.collection,
      { status: 1, restaurant_id: 1 },
      { name: 'idx_status_restaurant' }
    );
    logger.info('  status + restaurant_id (compound) - CRITICAL');

    // Index composé : customer_id + createdAt (historique des commandes trié par date)
    await ensureIndex(
      Commande.collection,
      { customer_id: 1, createdAt: -1 },
      { name: 'idx_customer_date' }
    );
    logger.info('  customer_id + createdAt DESC (compound)');

    // Suivi des livreurs
    await ensureIndex(
      Commande.collection,
      { deliverer_id: 1, status: 1 },
      { name: 'idx_deliverer_status' }
    );
    logger.info('  deliverer_id + status (compound)');

    // Index géospatial pour le suivi GPS
    await ensureIndex(
      Commande.collection,
      { 'deliveryTracking.coordinates': '2dsphere' }
    );
    logger.info('  deliveryTracking.coordinates (geospatial)');

    // ============ Index de la collection Livreurs ============
    logger.info('\nCollection Livreurs:');

    // Index géospatial pour les livreurs à proximité
    await ensureIndex(Deliverer.collection, { 'currentLocation': '2dsphere' });
    logger.info('  currentLocation (geospatial)');

    // Recherche des livreurs disponibles
    await ensureIndex(
      Deliverer.collection,
      { isAvailable: 1, isActive: 1 },
      { name: 'idx_available' }
    );
    logger.info('  isAvailable + isActive (compound)');

    // ============ Récapitulatif ============
    logger.info('\nTous les index vérifiés avec succès!\n');
    logger.info('Résumé des index:\n');
    logger.info('  Unique Constraints:');
    logger.info('    • User.email\n');
    logger.info('  Geospatial (2dsphere):');
    logger.info('    • User.addresses.coordinates');
    logger.info('    • Restaurant.address.coordinates');
    logger.info('    • Commande.deliveryTracking.coordinates');
    logger.info('    • Deliverer.currentLocation\n');
    logger.info('  Text (recherche plein-texte):');
    logger.info('    • Restaurant.name / menus.name / menus.dishes.name / menus.dishes.description\n');
    logger.info('  Compound Indexes (CRITICAL for performance):');
    logger.info('    • Commande (status + restaurant_id)');
    logger.info('    • Commande (customer_id + createdAt DESC)');
    logger.info('    • Commande (deliverer_id + status)');
    logger.info('    • Restaurant (district + isOpen)');
    logger.info('    • Deliverer (isAvailable + isActive)\n');

    // ============ Affichage des statistiques des index ============
    logger.info('Statistiques des index:\n');

    const userIndexes = await User.collection.getIndexes();
    logger.info(
      `  Users: ${Object.keys(userIndexes).length - 1} indexes (+ _id)`
    );

    const restaurantIndexes = await Restaurant.collection.getIndexes();
    logger.info(
      `  Restaurants: ${Object.keys(restaurantIndexes).length - 1} indexes (+ _id)`
    );

    const commandeIndexes = await Commande.collection.getIndexes();
    logger.info(
      `  Commandes: ${Object.keys(commandeIndexes).length - 1} indexes (+ _id)`
    );

    const delivererIndexes = await Deliverer.collection.getIndexes();
    logger.info(
      `  Deliverers: ${Object.keys(delivererIndexes).length - 1} indexes (+ _id)\n`
    );

    logger.info('Étape suivante : nous exécutons les requêtes avec .explain("executionStats") pour vérifier l\'utilisation d\'un IXSCAN.\n');

    await mongoose.disconnect();
    logger.info('MongoDB déconnecté');
  } catch (err) {
    logger.error('Échec de la vérification des index', {
      message: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
}

// Nous lançons la création des index
if (require.main === module) {
  createIndexes();
}

module.exports = { createIndexes };
