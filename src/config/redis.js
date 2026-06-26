const redis = require('redis');
const config = require('./index');
const { logger } = require('../utils/logger');

let redisClient = null;
let isConnected = false;

async function connectRedis() {
  try {
    redisClient = redis.createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Trop de tentatives de reconnexion Redis, abandon');
            return new Error('Trop de tentatives de reconnexion');
          }
          const delay = Math.min(retries * 100, 3000);
          logger.debug(`Tentative de reconnexion Redis #${retries}, délai: ${delay}ms`);
          return delay;
        },
      },
      password: config.redis.password || undefined,
    });

    redisClient.on('connect', () => {
      isConnected = true;
      logger.info('Redis connecté');
    });

    redisClient.on('error', (err) => {
      logger.debug('Redis indisponible, poursuite sans cache', {
        message: err.message,
      });
      isConnected = false;
    });

    await redisClient.connect();
    const pong = await redisClient.ping();

    if (pong === 'PONG') {
      isConnected = true;
      logger.info('Connexion Redis vérifiée');
    }
  } catch (err) {
    logger.info('Redis non disponible (développement : cache désactivé)');
    isConnected = false;
    redisClient = null;
  }
}

function getRedisClient() {
  if (!redisClient) {
    return null;
  }
  return redisClient;
}

function isRedisConnected() {
  return isConnected;
}

async function disconnectRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis déconnecté');
    } catch (err) {
      logger.debug('Erreur lors de la déconnexion Redis', {
        message: err.message,
      });
    }
  }
}

module.exports = {
  connectRedis,
  disconnectRedis,
  getRedisClient,
  isRedisConnected,
};
