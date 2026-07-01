const express = require('express');
const { createDeliverer, listAvailableDeliverers, getDeliverer, updateDelivererLocation } = require('../controllers/delivererController');
const validateObjectId = require('../middleware/validateObjectId');
const jwtAuth = require('../middleware/jwtAuth');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
const { updateDelivererLocationSchema, createDelivererSchema } = require('../schemas/delivererValidators');
const router = express.Router();

router.post('/', jwtAuth, authorize('DELIVERER'), validateRequest(createDelivererSchema), createDeliverer);
router.get('/', listAvailableDeliverers);
router.get('/:id', validateObjectId(), getDeliverer);
router.put('/:id/location', jwtAuth, validateObjectId(), validateRequest(updateDelivererLocationSchema), updateDelivererLocation);

module.exports = router;
