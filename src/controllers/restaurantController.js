const Restaurant = require('../models/Restaurant');
const { logger } = require('../utils/logger');
const AppError = require('../utils/AppError');
const cacheService = require('../services/cacheService');
const User = require('../models/User');

async function listRestaurants(req, res, next) {
  try {
    const query = {};
    const { district, isOpen, q, page = 1, limit = 10 } = req.query;

    if (district) query['address.district'] = district;
    if (typeof isOpen !== 'undefined') query.isOpen = isOpen === 'true';
    if (q) query.$text = { $search: q };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Nous générons la clé de cache
    const cacheKey = cacheService.getRestaurantCacheKey(district, isOpen, q, pageNum, limitNum);

    // Nous tentons de récupérer la valeur depuis le cache
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.debug('Cache hit pour listRestaurants', { cacheKey });
      return res.json(cached);
    }

    const [restaurants, total] = await Promise.all([
      Restaurant.find(query).skip(skip).limit(limitNum),
      Restaurant.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    const response = {
      restaurants,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    };

    // Nous stockons la réponse dans le cache (1 heure)
    await cacheService.set(cacheKey, response, cacheService.TTL.RESTAURANTS);
    logger.debug('Cache set pour listRestaurants', { cacheKey });

    res.json(response);
  } catch (err) {
    logger.error('Erreur liste restaurants', { message: err.message, stack: err.stack });
    next(err);
  }
}

// Nous livrons ici les restaurants ouverts disposant d'au moins un plat disponible
async function listOpenRestaurantsWithAvailability(req, res, next) {
  try {
    const query = {
      isOpen: true,
      menus: {
        $elemMatch: {
          dishes: { $elemMatch: { isAvailable: true, quantity: { $gt: 0 } } },
        },
      },
    };

    const restaurants = await Restaurant.find(query);
    res.json({ restaurants });
  } catch (err) {
    logger.error('Erreur liste restaurants ouverts avec plat disponible', {
      message: err.message,
      stack: err.stack,
    });
    next(err);
  }
}

async function getRestaurantById(req, res, next) {
  try {
    const { id } = req.params;

    // Nous générons la clé de cache
    const cacheKey = cacheService.getRestaurantDetailCacheKey(id);

    // Nous tentons de récupérer la valeur depuis le cache
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.debug('Cache hit pour getRestaurantById', { cacheKey });
      return res.json(cached);
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return next(AppError.notFound('Restaurant introuvable', { id }));
    }

    const response = { restaurant };

    // Nous stockons la réponse dans le cache (1 heure)
    await cacheService.set(cacheKey, response, cacheService.TTL.RESTAURANT_DETAIL);
    logger.debug('Cache set pour getRestaurantById', { cacheKey });

    res.json(response);
  } catch (err) {
    logger.error('Erreur lecture restaurant', { message: err.message, stack: err.stack });
    next(err);
  }
}

async function nearbyRestaurants(req, res, next) {
  try {
    const { lat, lng, maxDistance = 5000 } = req.query;
    const query = {
      'address.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(maxDistance, 10),
        },
      },
    };

    const restaurants = await Restaurant.find(query).limit(20);
    res.json({ restaurants });
  } catch (err) {
    logger.error('Erreur restaurants à proximité', { message: err.message, stack: err.stack });
    next(err);
  }
}

async function updateRestaurant(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.validated.body;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return next(AppError.notFound('Restaurant introuvable', { id }));
    }

    // Nous vérifions que l'utilisateur est le propriétaire
    if (restaurant.owner_id.toString() !== req.user.id) {
      return next(AppError.forbidden('Accès interdit : vous n\'êtes pas le propriétaire', { restaurantId: id }));
    }

    Object.assign(restaurant, updates);
    restaurant.metadata.updatedAt = new Date();

    await restaurant.save();

    // Nous invalidons le cache
    await cacheService.del(cacheService.getRestaurantDetailCacheKey(id));
    await cacheService.invalidate('restaurants:*');
    logger.debug('Cache invalidé pour updateRestaurant', { restaurantId: id });

    res.json({ restaurant });
  } catch (err) {
    logger.error('Erreur mise à jour restaurant', { message: err.message, stack: err.stack });
    next(err);
  }
}

// ============ CRUD DES MENUS ============

async function createMenu(req, res, next) {
  try {
    const { id } = req.params;
    const menuData = req.validated.body;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return next(AppError.notFound('Restaurant introuvable', { id }));
    }

    // Nous vérifions que l'utilisateur est le propriétaire
    if (restaurant.owner_id.toString() !== req.user.id) {
      return next(AppError.forbidden('Accès interdit : vous n\'êtes pas le propriétaire', { restaurantId: id }));
    }

    // Nous ajoutons le nouveau menu
    const newMenu = {
      name: menuData.name,
      description: menuData.description,
      dishes: menuData.dishes || [],
    };
    restaurant.menus.push(newMenu);
    restaurant.metadata.updatedAt = new Date();

    await restaurant.save();

    // Nous invalidons le cache
    await cacheService.del(cacheService.getRestaurantDetailCacheKey(id));
    await cacheService.invalidate('restaurants:*');
    logger.debug('Menu créé', { restaurantId: id, menuName: newMenu.name });

    res.status(201).json({ menu: restaurant.menus[restaurant.menus.length - 1], restaurant });
  } catch (err) {
    logger.error('Erreur création menu', { message: err.message, stack: err.stack });
    next(err);
  }
}

async function getMenus(req, res, next) {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return next(AppError.notFound('Restaurant introuvable', { id }));
    }

    res.json({ menus: restaurant.menus });
  } catch (err) {
    logger.error('Erreur lecture menus', { message: err.message, stack: err.stack });
    next(err);
  }
}

// Nous retournons ici les restaurants appartenant à l'utilisateur connecté
async function getMyRestaurants(req, res, next) {
  try {
    const userId = req.user.id;
    const restaurants = await Restaurant.find({ owner_id: userId });
    res.json({ restaurants });
  } catch (err) {
    logger.error('Erreur lecture restaurants du vendeur', { message: err.message, stack: err.stack });
    next(err);
  }
}

// Nous créons ici un restaurant minimal pour le vendeur connecté
async function createRestaurant(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, address, deliveryZones, phone } = req.body || {};

    // Nous récupérons les informations de l'utilisateur afin de compléter si nécessaire
    const user = await User.findById(userId);
    if (!user) return next(AppError.notFound('Utilisateur introuvable', { userId }));

    const restaurantName = name || (user.profile && user.profile.extra && user.profile.extra.restaurantName) || `Restaurant de ${user.profile?.firstName || 'Vendeur'}`;
    if (!phone) return next(AppError.badRequest('Le téléphone du restaurant est requis'));
    if (!address || !address.street) return next(AppError.badRequest('L\'adresse du restaurant est requise'));
    if (!address.district) return next(AppError.badRequest('Le quartier du restaurant est requis'));

    const restaurant = new Restaurant({
      name: restaurantName,
      email: user.email,
      phone,
      address: {
        street: address.street,
        district: address.district,
        city: 'Libreville',
        coordinates: {
          type: 'Point',
          coordinates: [0, 0],
        },
      },
      owner_id: userId,
      deliveryZones: deliveryZones || [],
    });

    await restaurant.save();

    // Nous invalidons le cache
    await cacheService.invalidate('restaurants:*');
    logger.debug('Restaurant créé via onboarding', { restaurantId: restaurant._id, ownerId: userId });

    res.status(201).json({ restaurant });
  } catch (err) {
    logger.error('Erreur création restaurant', { message: err.message, stack: err.stack });
    next(err);
  }
}

async function updateMenu(req, res, next) {
  try {
    const { id, menuId } = req.params;
    const updates = req.validated.body;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return next(AppError.notFound('Restaurant introuvable', { id }));
    }

    // Nous vérifions que l'utilisateur est le propriétaire
    if (restaurant.owner_id.toString() !== req.user.id) {
      return next(AppError.forbidden('Accès interdit : vous n\'êtes pas le propriétaire', { restaurantId: id }));
    }

    // Nous recherchons le menu à mettre à jour
    const menu = restaurant.menus.id(menuId);
    if (!menu) {
      return next(AppError.notFound('Menu introuvable', { menuId }));
    }

    Object.assign(menu, updates);
    restaurant.metadata.updatedAt = new Date();

    await restaurant.save();

    // Nous invalidons le cache
    await cacheService.del(cacheService.getRestaurantDetailCacheKey(id));
    await cacheService.invalidate('restaurants:*');
    logger.debug('Menu mis à jour', { restaurantId: id, menuId });

    res.json({ menu, restaurant });
  } catch (err) {
    logger.error('Erreur mise à jour menu', { message: err.message, stack: err.stack });
    next(err);
  }
}

async function deleteMenu(req, res, next) {
  try {
    const { id, menuId } = req.params;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return next(AppError.notFound('Restaurant introuvable', { id }));
    }

    // Nous vérifions que l'utilisateur est le propriétaire
    if (restaurant.owner_id.toString() !== req.user.id) {
      return next(AppError.forbidden('Accès interdit : vous n\'êtes pas le propriétaire', { restaurantId: id }));
    }

    // Nous recherchons le menu à supprimer
    const menu = restaurant.menus.id(menuId);
    if (!menu) {
      return next(AppError.notFound('Menu introuvable', { menuId }));
    }

    menu.deleteOne();
    restaurant.metadata.updatedAt = new Date();

    await restaurant.save();

    // Nous invalidons le cache
    await cacheService.del(cacheService.getRestaurantDetailCacheKey(id));
    await cacheService.invalidate('restaurants:*');
    logger.debug('Menu supprimé', { restaurantId: id, menuId });

    res.status(204).send();
  } catch (err) {
    logger.error('Erreur suppression menu', { message: err.message, stack: err.stack });
    next(err);
  }
}

// ============ CRUD DES PLATS ============

async function addDishToMenu(req, res, next) {
  try {
    const { id, menuId } = req.params;
    const dishData = req.validated.body;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return next(AppError.notFound('Restaurant introuvable', { id }));
    }

    // Nous vérifions que l'utilisateur est le propriétaire
    if (restaurant.owner_id.toString() !== req.user.id) {
      return next(AppError.forbidden('Accès interdit : vous n\'êtes pas le propriétaire', { restaurantId: id }));
    }

    // Nous recherchons le menu cible
    const menu = restaurant.menus.id(menuId);
    if (!menu) {
      return next(AppError.notFound('Menu introuvable', { menuId }));
    }

    // Nous ajoutons le plat
    menu.dishes.push(dishData);
    restaurant.metadata.updatedAt = new Date();

    await restaurant.save();

    // Nous invalidons le cache
    await cacheService.del(cacheService.getRestaurantDetailCacheKey(id));
    await cacheService.invalidate('restaurants:*');
    logger.debug('Plat ajouté au menu', { restaurantId: id, menuId, dishName: dishData.name });

    res.status(201).json({ dish: menu.dishes[menu.dishes.length - 1], menu, restaurant });
  } catch (err) {
    logger.error('Erreur ajout plat', { message: err.message, stack: err.stack });
    next(err);
  }
}

async function updateDish(req, res, next) {
  try {
    const { id, menuId, dishId } = req.params;
    const updates = req.validated.body;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return next(AppError.notFound('Restaurant introuvable', { id }));
    }

    // Nous vérifions que l'utilisateur est le propriétaire
    if (restaurant.owner_id.toString() !== req.user.id) {
      return next(AppError.forbidden('Accès interdit : vous n\'êtes pas le propriétaire', { restaurantId: id }));
    }

    // Nous recherchons le menu cible
    const menu = restaurant.menus.id(menuId);
    if (!menu) {
      return next(AppError.notFound('Menu introuvable', { menuId }));
    }

    // Nous recherchons et mettons à jour le plat
    const dish = menu.dishes.id(dishId);
    if (!dish) {
      return next(AppError.notFound('Plat introuvable', { dishId }));
    }

    Object.assign(dish, updates);
    restaurant.metadata.updatedAt = new Date();

    await restaurant.save();

    // Nous invalidons le cache
    await cacheService.del(cacheService.getRestaurantDetailCacheKey(id));
    await cacheService.invalidate('restaurants:*');
    logger.debug('Plat mis à jour', { restaurantId: id, menuId, dishId });

    res.json({ dish, menu, restaurant });
  } catch (err) {
    logger.error('Erreur mise à jour plat', { message: err.message, stack: err.stack });
    next(err);
  }
}

async function deleteDish(req, res, next) {
  try {
    const { id, menuId, dishId } = req.params;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return next(AppError.notFound('Restaurant introuvable', { id }));
    }

    // Nous vérifions que l'utilisateur est le propriétaire
    if (restaurant.owner_id.toString() !== req.user.id) {
      return next(AppError.forbidden('Accès interdit : vous n\'êtes pas le propriétaire', { restaurantId: id }));
    }

    // Nous recherchons le menu cible
    const menu = restaurant.menus.id(menuId);
    if (!menu) {
      return next(AppError.notFound('Menu introuvable', { menuId }));
    }

    // Nous supprimons le plat
    const dish = menu.dishes.id(dishId);
    if (!dish) {
      return next(AppError.notFound('Plat introuvable', { dishId }));
    }

    dish.deleteOne();
    restaurant.metadata.updatedAt = new Date();

    await restaurant.save();

    // Nous invalidons le cache
    await cacheService.del(cacheService.getRestaurantDetailCacheKey(id));
    await cacheService.invalidate('restaurants:*');
    logger.debug('Plat supprimé', { restaurantId: id, menuId, dishId });

    res.status(204).send();
  } catch (err) {
    logger.error('Erreur suppression plat', { message: err.message, stack: err.stack });
    next(err);
  }
}

module.exports = {
  listRestaurants,
  listOpenRestaurantsWithAvailability,
  getRestaurantById,
  nearbyRestaurants,
  updateRestaurant,
  createMenu,
  getMenus,
  getMyRestaurants,
  createRestaurant,
  updateMenu,
  deleteMenu,
  addDishToMenu,
  updateDish,
  deleteDish,
};
