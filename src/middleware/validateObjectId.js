const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

// Nous définissons ce middleware afin de valider les paramètres ObjectId.
// Nous l'utilisons sur les routes qui possèdent des paramètres :id
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
