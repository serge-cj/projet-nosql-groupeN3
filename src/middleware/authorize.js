const AppError = require('../utils/AppError');

/**
 * Middleware pour autoriser l'accès basé sur les rôles
 * @param  {...string} allowedRoles - Les rôles autorisés à accéder à la route
 * @returns {Function} - Middleware Express
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('Utilisateur non authentifié'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden('Accès interdit : rôle insuffisant', {
          userRole: req.user.role,
          requiredRoles: allowedRoles,
        })
      );
    }

    next();
  };
}

module.exports = authorize;
