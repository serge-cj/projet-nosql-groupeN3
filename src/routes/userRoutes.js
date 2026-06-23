const express = require('express');
const {
  getProfile,
  updateProfile,
  addFavoriteRestaurant,
  removeFavoriteRestaurant,
} = require('../controllers/userController');
const validateRequest = require('../middleware/validateRequest');
const { updateProfileSchema } = require('../schemas/userValidators');
const jwtAuth = require('../middleware/jwtAuth');
const validateObjectId = require('../middleware/validateObjectId');

const router = express.Router();

router.get('/profile', jwtAuth, getProfile);
router.put('/profile', jwtAuth, validateRequest(updateProfileSchema), updateProfile);

router.post(
  '/favorites/restaurants/:restaurantId',
  jwtAuth,
  validateObjectId('restaurantId'),
  addFavoriteRestaurant
);
router.delete(
  '/favorites/restaurants/:restaurantId',
  jwtAuth,
  validateObjectId('restaurantId'),
  removeFavoriteRestaurant
);

module.exports = router;
