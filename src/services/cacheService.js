const { getRedisClient, isRedisConnected } = require('../config/redis');
const { logger } = require('../utils/logger');

// TTL en secondes
const TTL = {
  RESTAURANTS: 3600, // 1 heure
  RESTAURANT_DETAIL: 3600, // 1 heure
  ORDERS: 300, // 5 minutes
  ORDER_DETAIL: 300, // 5 minutes
};

/**
 * Récupérer une valeur depuis le cache
 * @param {string} key - Clé du cache
 * @returns {Promise<any|null>} - Valeur cachée ou null
 */
async function get(key) {
  try {
    if (!isRedisConnected()) {
      return null;
    }

    const client = getRedisClient();
    if (!client) {
      return null;
    }

    const value = await client.get(key);
    if (!value) {
      return null;
    }

    return JSON.parse(value);
  } catch (err) {
    logger.error('Erreur lecture cache', { key, message: err.message });
    return null;
  }
}

/**
 * Stocker une valeur dans le cache
 * @param {string} key - Clé du cache
 * @param {any} value - Valeur à stocker
 * @param {number} ttl - Durée de vie en secondes
 * @returns {Promise<boolean>} - true si succès
 */
async function set(key, value, ttl = 3600) {
  try {
    if (!isRedisConnected()) {
      return false;
    }

    const client = getRedisClient();
    if (!client) {
      return false;
    }

    const serialized = JSON.stringify(value);
    await client.setEx(key, ttl, serialized);
    return true;
  } catch (err) {
    logger.error('Erreur écriture cache', { key, message: err.message });
    return false;
  }
}

/**
 * Invalider le cache par pattern
 * @param {string} pattern - Pattern de clés à invalider (ex: restaurants:*)
 * @returns {Promise<number>} - Nombre de clés invalidées
 */
async function invalidate(pattern) {
  try {
    if (!isRedisConnected()) {
      return 0;
    }

    const client = getRedisClient();
    if (!client) {
      return 0;
    }

    const keys = await client.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }

    await client.del(keys);
    return keys.length;
  } catch (err) {
    logger.error('Erreur invalidation cache', { pattern, message: err.message });
    return 0;
  }
}

/**
 * Supprimer une clé spécifique du cache
 * @param {string} key - Clé à supprimer
 * @returns {Promise<boolean>} - true si succès
 */
async function del(key) {
  try {
    if (!isRedisConnected()) {
      return false;
    }

    const client = getRedisClient();
    if (!client) {
      return false;
    }

    await client.del(key);
    return true;
  } catch (err) {
    logger.error('Erreur suppression cache', { key, message: err.message });
    return false;
  }
}

/**
 * Générer une clé de cache pour les restaurants
 * @param {string} district - District (optionnel)
 * @param {string} isOpen - Statut d'ouverture (optionnel)
 * @param {string} q - Recherche textuelle (optionnel)
 * @param {number|string} page - Page demandée
 * @param {number|string} limit - Nombre d'éléments par page
 * @returns {string} - Clé de cache
 */
function getRestaurantCacheKey(district = null, isOpen = null, q = null, page = 1, limit = 10) {
  const parts = ['restaurants'];
  if (district) parts.push(`district:${district}`);
  if (isOpen !== null) parts.push(`isOpen:${isOpen}`);
  if (q) parts.push(`q:${q}`);
  parts.push(`page:${page}`);
  parts.push(`limit:${limit}`);
  return parts.join(':');
}

/**
 * Générer une clé de cache pour un restaurant spécifique
 * @param {string} restaurantId - ID du restaurant
 * @returns {string} - Clé de cache
 */
function getRestaurantDetailCacheKey(restaurantId) {
  return `restaurant:${restaurantId}`;
}

/**
 * Générer une clé de cache pour les commandes d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} status - Statut de commande (optionnel)
 * @returns {string} - Clé de cache
 */
function getOrderCacheKey(userId, status = null) {
  const parts = ['orders', `user:${userId}`];
  if (status) parts.push(`status:${status}`);
  return parts.join(':');
}

/**
 * Générer une clé de cache pour une commande spécifique
 * @param {string} orderId - ID de la commande
 * @returns {string} - Clé de cache
 */
function getOrderDetailCacheKey(orderId) {
  return `order:${orderId}`;
}

module.exports = {
  get,
  set,
  invalidate,
  del,
  TTL,
  getRestaurantCacheKey,
  getRestaurantDetailCacheKey,
  getOrderCacheKey,
  getOrderDetailCacheKey,
};
