const mongoose = require('mongoose');
const config = require('./index');
const { logger } = require('../utils/logger');

let isConnected = false;

async function connectDatabase() {
  if (isConnected) {
    logger.debug('Base de données déjà connectée');
    return;
  }

  try {
    const mongoUri = config.mongodb.uri;

    logger.info('Connexion à MongoDB...');
    logger.debug(`URI : ${mongoUri.replace(/:[^@]*@/, ':****@')}`);

    await mongoose.connect(mongoUri, {
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    logger.info(' MongoDB connecté');

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB déconnecté');
      isConnected = false;
    });

    mongoose.connection.on('error', (err) => {
      logger.error('Erreur MongoDB', err);
      isConnected = false;
    });
  } catch (err) {
    logger.error('Échec de connexion à MongoDB', {
      message: err.message,
      stack: err.stack,
    });
    throw err;
  }
}

async function disconnectDatabase() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      logger.info('MongoDB déconnecté');
    }
  } catch (err) {
    logger.error('Erreur lors de la déconnexion MongoDB', err);
  }
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
  mongoose,
};
