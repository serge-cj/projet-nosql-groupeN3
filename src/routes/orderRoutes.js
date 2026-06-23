const express = require('express');
const { createOrder, getOrder, listOrders, updateOrderStatus, assignDeliverer, deleteOrder } = require('../controllers/orderController');
const validateRequest = require('../middleware/validateRequest');
const { placeOrderSchema, updateOrderStatusSchema, assignDelivererSchema } = require('../schemas/orderValidators');
const jwtAuth = require('../middleware/jwtAuth');
const authorize = require('../middleware/authorize');
const validateObjectId = require('../middleware/validateObjectId');

const router = express.Router();

router.post('/', jwtAuth, validateRequest(placeOrderSchema), createOrder);
router.get('/', jwtAuth, listOrders);
router.get('/:id', jwtAuth, validateObjectId(), getOrder);
router.patch('/:id/status', jwtAuth, validateObjectId(), validateRequest(updateOrderStatusSchema), updateOrderStatus);
router.post('/:id/assign', jwtAuth, authorize('VENDOR', 'ADMIN'), validateObjectId(), validateRequest(assignDelivererSchema), assignDeliverer);
router.delete('/:id', jwtAuth, validateObjectId(), deleteOrder);

module.exports = router;
