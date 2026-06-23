const express = require('express');
const { listAvailableDeliverers, getDeliverer, updateDelivererLocation } = require('../controllers/delivererController');
const validateObjectId = require('../middleware/validateObjectId');
const jwtAuth = require('../middleware/jwtAuth');
const validateRequest = require('../middleware/validateRequest');
const { updateDelivererLocationSchema } = require('../schemas/delivererValidators');
const router = express.Router();

router.get('/', listAvailableDeliverers);
router.get('/:id', validateObjectId(), getDeliverer);
router.put('/:id/location', jwtAuth, validateObjectId(), validateRequest(updateDelivererLocationSchema), updateDelivererLocation);

module.exports = router;
