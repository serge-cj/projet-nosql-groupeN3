const AppError = require('../utils/AppError');

/**
 * Nous définissons ce middleware afin d'autoriser l'accès selon les rôles.
 * @param  {...string} allowedRoles - Les rôles que nous autorisons à accéder à la route
 * @returns {Function} - Le middleware Express que nous construisons
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
