const User = require('../models/User');
const { logger } = require('../utils/logger');
const AppError = require('../utils/AppError');

async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return next(AppError.notFound('Utilisateur introuvable', { userId }));
    }

    res.json({ user });
  } catch (err) {
    logger.error('Erreur lecture profil', { message: err.message, stack: err.stack });
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const updates = req.validated.body;
    const user = await User.findById(userId);
    if (!user) {
      return next(AppError.notFound('Utilisateur introuvable', { userId }));
    }

    if (updates.profile) {
      user.profile = {
        ...user.profile.toObject ? user.profile.toObject() : user.profile,
        ...updates.profile,
      };
      delete updates.profile;
    }

    if (updates.addresses) {
      user.addresses = updates.addresses;
      delete updates.addresses;
    }

    Object.assign(user, updates);
    user.metadata.updatedAt = new Date();
    await user.save();

    res.json({ user: await User.findById(userId).select('-password') });
  } catch (err) {
    logger.error('Erreur mise à jour profil', { message: err.message, stack: err.stack });
    next(err);
  }
}

// Nous ajoutons un restaurant aux favoris ($addToSet : équivalent idempotent de $push)
async function addFavoriteRestaurant(req, res, next) {
  try {
    const userId = req.user.id;
    const { restaurantId } = req.params;

    const user = await User.findOneAndUpdate(
      { _id: userId },
      { $addToSet: { favoriteRestaurants: restaurantId } },
      { new: true }
    ).select('favoriteRestaurants');

    if (!user) {
      return next(AppError.notFound('Utilisateur introuvable', { userId }));
    }

    res.json({ favoriteRestaurants: user.favoriteRestaurants });
  } catch (err) {
    logger.error('Erreur ajout favori', { message: err.message, stack: err.stack });
    next(err);
  }
}

// Nous retirons un restaurant des favoris ($pull)
async function removeFavoriteRestaurant(req, res, next) {
  try {
    const userId = req.user.id;
    const { restaurantId } = req.params;

    const user = await User.findOneAndUpdate(
      { _id: userId },
      { $pull: { favoriteRestaurants: restaurantId } },
      { new: true }
    ).select('favoriteRestaurants');

    if (!user) {
      return next(AppError.notFound('Utilisateur introuvable', { userId }));
    }

    res.json({ favoriteRestaurants: user.favoriteRestaurants });
  } catch (err) {
    logger.error('Erreur suppression favori', { message: err.message, stack: err.stack });
    next(err);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  addFavoriteRestaurant,
  removeFavoriteRestaurant,
};
