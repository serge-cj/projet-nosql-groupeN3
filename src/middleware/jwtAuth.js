const { verifyToken } = require('../utils/token');
const { logger } = require('../utils/logger');

function jwtAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('En-tête Authorization manquant ou invalide');
    err.statusCode = 401;
    return next(err);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Échec vérification JWT', { message: error.message });
    const err = new Error('Jeton invalide ou expiré');
    err.statusCode = 401;
    return next(err);
  }
}

module.exports = jwtAuth;
