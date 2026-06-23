require('dotenv').config();

const {
  connectDatabase,
  disconnectDatabase,
} = require('../src/config/database');
const { User, Restaurant, Commande, Deliverer } = require('../src/models');
const { logger } = require('../src/utils/logger');

async function cleanup() {
  try {
    await connectDatabase();

    const results = await Promise.all([
      User.deleteMany({}),
      Restaurant.deleteMany({}),
      Commande.deleteMany({}),
      Deliverer.deleteMany({}),
    ]);

    logger.info('Base nettoyée', {
      utilisateurs: results[0].deletedCount,
      restaurants: results[1].deletedCount,
      commandes: results[2].deletedCount,
      livreurs: results[3].deletedCount,
    });
  } catch (err) {
    logger.error('Échec du nettoyage', { message: err.message, stack: err.stack });
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}

if (require.main === module) {
  cleanup();
}

module.exports = cleanup;
