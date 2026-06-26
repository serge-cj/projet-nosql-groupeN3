const express = require('express');
const {
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
} = require('../controllers/restaurantController');
const validateObjectId = require('../middleware/validateObjectId');
const jwtAuth = require('../middleware/jwtAuth');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const {
  createMenuSchema,
  updateMenuSchema,
  createRestaurantSchema,
  addDishToMenuSchema,
  updateDishSchema,
} = require('../schemas/restaurantValidators');

const router = express.Router();

// Nous exposons ici les routes publiques des restaurants
router.get('/', listRestaurants);
router.get('/open', listOpenRestaurantsWithAvailability);
router.get('/nearby', nearbyRestaurants);

// Nous permettons la création d'un restaurant pour un vendeur authentifié (onboarding)
router.post('/', jwtAuth, authorize('VENDOR', 'ADMIN'), validateRequest(createRestaurantSchema), createRestaurant);

// Nous récupérons les restaurants du vendeur authentifié
router.get('/me', jwtAuth, authorize('VENDOR', 'ADMIN'), getMyRestaurants);

router.get('/:id', validateObjectId(), getRestaurantById);

// Nous réservons la mise à jour du restaurant au vendeur
router.patch('/:id', jwtAuth, validateObjectId(), authorize('VENDOR', 'ADMIN'), updateRestaurant);

// ============ ROUTES DES MENUS ============
// Nous exposons la récupération de tous les menus d'un restaurant (route publique)
router.get('/:id/menus', validateObjectId(), getMenus);

// Nous réservons la création d'un menu au vendeur
router.post('/:id/menus', jwtAuth, validateObjectId(), authorize('VENDOR', 'ADMIN'), validateRequest(createMenuSchema), createMenu);

// Nous réservons la mise à jour d'un menu au vendeur
router.patch('/:id/menus/:menuId', jwtAuth, validateObjectId(), authorize('VENDOR', 'ADMIN'), validateRequest(updateMenuSchema), updateMenu);

// Nous réservons la suppression d'un menu au vendeur
router.delete('/:id/menus/:menuId', jwtAuth, validateObjectId(), authorize('VENDOR', 'ADMIN'), deleteMenu);

// ============ ROUTES DES PLATS ============
// Nous réservons l'ajout d'un plat à un menu au vendeur
router.post('/:id/menus/:menuId/dishes', jwtAuth, validateObjectId(), authorize('VENDOR', 'ADMIN'), validateRequest(addDishToMenuSchema), addDishToMenu);

// Nous réservons la mise à jour d'un plat d'un menu au vendeur
router.patch('/:id/menus/:menuId/dishes/:dishId', jwtAuth, validateObjectId(), authorize('VENDOR', 'ADMIN'), validateRequest(updateDishSchema), updateDish);

// Nous réservons la suppression d'un plat d'un menu au vendeur
router.delete('/:id/menus/:menuId/dishes/:dishId', jwtAuth, validateObjectId(), authorize('VENDOR', 'ADMIN'), deleteDish);

module.exports = router;
