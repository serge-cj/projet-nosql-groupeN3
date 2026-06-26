const rateLimit = require('express-rate-limit');

// Nous mettons en place ce limiteur de débit pour les routes d'authentification.
// Nous appliquons cette règle afin de prévenir les attaques par force brute sur login et register
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 5, // Nous assouplissons la limite en environnement de test tout en conservant la protection en production
  message: {
    error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
  },
  standardHeaders: true, // Nous retournons les en-têtes RateLimit-* dans la réponse
  legacyHeaders: false, // Nous désactivons les en-têtes X-RateLimit-*
  skipSuccessfulRequests: false, // Nous comptons également les requêtes réussies
});

// Nous définissons un limiteur de débit moins strict pour les autres routes de l'API
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Nous autorisons au maximum 100 requêtes par fenêtre de 15 minutes
  message: {
    error: 'Trop de requêtes. Veuillez réessayer plus tard.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authRateLimiter,
  apiRateLimiter,
};
