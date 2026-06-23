const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

// Middleware pour valider les paramètres ObjectId
// À utiliser sur les routes qui ont des paramètres :id
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(AppError.badRequest(`ID invalide: ${id}`, { paramName, id }));
    }
    
    next();
  };
};

module.exports = validateObjectId;
