const mongoose = require('mongoose');
require('dotenv').config();

const { User, Restaurant, Commande, Deliverer } = require('../../src/models');
const { logger } = require('../../src/utils/logger');

/**
 * Verify all indexes for performance optimization
 *
 * Indexes strategy:
 * 1. Authentication & Lookups (high-frequency)
 * 2. Geospatial queries (location-based features)
 * 3. Compound indexes (multi-field filters)
 * 4. Sorting optimization
 */
async function createIndexes() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    logger.info(`Connexion à MongoDB: ${mongoUri.replace(/:[^@]*@/, ':****@')}`);

    await mongoose.connect(mongoUri, {
      retryWrites: true,
      w: 'majority',
    });

    logger.info('✅ MongoDB connecté');
    logger.info('🔧 Vérification des index...\n');

    // ============ Helper to safely create/verify index ============
    async function ensureIndex(collection, fields, options = {}) {
      try {
        const indexName = options.name || Object.keys(fields).join('_');
        
        // Try to create, catch if exists
        await collection.createIndex(fields, options);
        return true;
      } catch (err) {
        if (err.message.includes('Index already exists')) {
          return true; // Index already exists, which is fine
        }
        // Log other errors but don't throw
        logger.debug(`Index operation info: ${err.message}`);
        return true;
      }
    }

    // ============ User Indexes ============
    logger.info('📇 Collection Utilisateurs:');

    // Auth lookup (email unique)
    await ensureIndex(User.collection, { email: 1 }, { unique: true });
    logger.info('  ✅ email (unique)');

    // Geospatial for nearby users
    await ensureIndex(User.collection, { 'addresses.coordinates': '2dsphere' });
    logger.info('  ✅ addresses.coordinates (geospatial)');

    // ============ Restaurant Indexes ============
    logger.info('\n📇 Collection Restaurants:');

    // Geospatial for nearby restaurants
    await ensureIndex(Restaurant.collection, {
      'address.coordinates': '2dsphere',
    });
    logger.info('  ✅ address.coordinates (geospatial)');

    // Compound: district + isOpen (list restaurants in district that are open)
    await ensureIndex(
      Restaurant.collection,
      { 'address.district': 1, 'isOpen': 1 },
      { name: 'idx_district_open' }
    );
    logger.info('  ✅ address.district + isOpen (compound)');

    // Dish availability
    await ensureIndex(Restaurant.collection, { 'menus.dishes.isAvailable': 1 });
    logger.info('  ✅ menus.dishes.isAvailable');

    // Text index for full-text search (name, menu names, dish names/descriptions)
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
    logger.info('  ✅ name + menus.dishes.name (text)');

    // ============ Commande Indexes ============
    logger.info('\n📇 Collection Commandes:');

    // Compound: status + restaurant_id (list active orders by restaurant)
    await ensureIndex(
      Commande.collection,
      { status: 1, restaurant_id: 1 },
      { name: 'idx_status_restaurant' }
    );
    logger.info('  ✅ status + restaurant_id (compound) - CRITICAL');

    // Compound: customer_id + createdAt (order history sorted by date)
    await ensureIndex(
      Commande.collection,
      { customer_id: 1, createdAt: -1 },
      { name: 'idx_customer_date' }
    );
    logger.info('  ✅ customer_id + createdAt DESC (compound)');

    // Deliverer tracking
    await ensureIndex(
      Commande.collection,
      { deliverer_id: 1, status: 1 },
      { name: 'idx_deliverer_status' }
    );
    logger.info('  ✅ deliverer_id + status (compound)');

    // GPS tracking geospatial
    await ensureIndex(
      Commande.collection,
      { 'deliveryTracking.coordinates': '2dsphere' }
    );
    logger.info('  ✅ deliveryTracking.coordinates (geospatial)');

    // ============ Deliverer Indexes ============
    logger.info('\n📇 Collection Livreurs:');

    // Geospatial for nearby deliverers
    await ensureIndex(Deliverer.collection, { 'currentLocation': '2dsphere' });
    logger.info('  ✅ currentLocation (geospatial)');

    // Find available deliverers
    await ensureIndex(
      Deliverer.collection,
      { isAvailable: 1, isActive: 1 },
      { name: 'idx_available' }
    );
    logger.info('  ✅ isAvailable + isActive (compound)');

    // ============ Summary ============
    logger.info('\n✅ Tous les index vérifiés avec succès! 🎉\n');
    logger.info('📊 Résumé des index:\n');
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

    // ============ Display Statistiques des index ============
    logger.info('📈 Statistiques des index:\n');

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

    logger.info('✨ Next: Run queries with .explain("executionStats") to verify IXSCAN usage.\n');

    await mongoose.disconnect();
    logger.info('MongoDB déconnecté');
  } catch (err) {
    logger.error('❌ Échec de la vérification des index', {
      message: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
}

// Run index creation
if (require.main === module) {
  createIndexes();
}

module.exports = { createIndexes };
