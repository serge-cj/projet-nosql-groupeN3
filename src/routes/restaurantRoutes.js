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

// Public restaurant routes
router.get('/', listRestaurants);
router.get('/open', listOpenRestaurantsWithAvailability);
router.get('/nearby', nearbyRestaurants);

// Create restaurant for authenticated vendor (onboarding)
router.post('/', jwtAuth, authorize('VENDOR', 'ADMIN'), validateRequest(createRestaurantSchema), createRestaurant);

// Get restaurants for authenticated vendor
router.get('/me', jwtAuth, authorize('VENDOR', 'ADMIN'), getMyRestaurants);

router.get('/:id', validateObjectId(), getRestaurantById);

// Vendor-only restaurant update
router.patch('/:id', jwtAuth, validateObjectId(), authorize('VENDOR', 'ADMIN'), updateRestaurant);

// ============ MENU ROUTES ============
// Get all menus for a restaurant (public)
router.get('/:id/menus', validateObjectId(), getMenus);

// Create menu (vendor only)
router.post('/:id/menus', jwtAuth, validateObjectId(), authorize('VENDOR', 'ADMIN'), validateRequest(createMenuSchema), createMenu);

// Update menu (vendor only)
router.patch('/:id/menus/:menuId', jwtAuth, validateObjectId(), authorize('VENDOR', 'ADMIN'), validateRequest(updateMenuSchema), updateMenu);

// Delete menu (vendor only)
router.delete('/:id/menus/:menuId', jwtAuth, validateObjectId(), authorize('VENDOR', 'ADMIN'), deleteMenu);

// ============ DISH ROUTES ============
// Add dish to menu (vendor only)
router.post('/:id/menus/:menuId/dishes', jwtAuth, validateObjectId(), authorize('VENDOR', 'ADMIN'), validateRequest(addDishToMenuSchema), addDishToMenu);

// Update dish in menu (vendor only)
router.patch('/:id/menus/:menuId/dishes/:dishId', jwtAuth, validateObjectId(), authorize('VENDOR', 'ADMIN'), validateRequest(updateDishSchema), updateDish);

// Delete dish from menu (vendor only)
router.delete('/:id/menus/:menuId/dishes/:dishId', jwtAuth, validateObjectId(), authorize('VENDOR', 'ADMIN'), deleteDish);

module.exports = router;
