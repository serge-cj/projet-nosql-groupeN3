const Commande = require('../models/Commande');
const Restaurant = require('../models/Restaurant');
const Deliverer = require('../models/Deliverer');
const { logger } = require('../utils/logger');
const AppError = require('../utils/AppError');
const { isValidTransition } = require('../utils/orderStateMachine');
const cacheService = require('../services/cacheService');
const { emitToRoom, emitToUser } = require('../socket');

async function createOrder(req, res, next) {
  try {
    const { restaurantId, deliveryInfo, paymentMethod, items } = req.validated.body;
    const userId = req.user.id;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return next(AppError.notFound('Restaurant introuvable', { restaurantId }));
    }

    const enrichedItems = items.map((item) => ({
      dishId: item.dishId,
      dishName: item.dishName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
    }));

    const subtotal = enrichedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const deliveryFee = restaurant.deliveryZones?.[0]?.deliveryFee || 1000;
    const tax = Math.round(subtotal * 0.12);
    const total = subtotal + deliveryFee + tax;

    const order = new Commande({
      customer_id: userId,
      restaurant_id: restaurantId,
      items: enrichedItems,
      pricing: {
        subtotal,
        deliveryFee,
        discount: 0,
        tax,
        total,
        currency: 'FCFA',
      },
      status: 'PENDING',
      deliveryInfo: {
        ...deliveryInfo,
        type: 'DELIVERY',
      },
      payment: {
        method: paymentMethod,
        status: 'PENDING',
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await order.save();

    // Invalider le cache des commandes de l'utilisateur
    await cacheService.invalidate(`orders:user:${userId}*`);
    logger.debug('Cache invalidé pour createOrder', { userId });

    res.status(201).json({ order });
  } catch (err) {
    logger.error('Erreur création commande', { message: err.message, stack: err.stack });
    next(err);
  }
}

async function getOrder(req, res, next) {
  try {
    const { id } = req.params;
    
    // Générer la clé de cache
    const cacheKey = cacheService.getOrderDetailCacheKey(id);

    // Essayer de récupérer depuis le cache
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.debug('Cache hit pour getOrder', { cacheKey });
      return res.json(cached);
    }

    const order = await Commande.findById(id)
      .populate({
        path: 'deliverer_id',
        select: 'personalInfo.firstName personalInfo.lastName',
      });
    if (!order) {
      return next(AppError.notFound('Commande introuvable', { id }));
    }

    if (order.customer_id.toString() !== req.user.id && order.deliverer_id?.toString() !== req.user.id) {
      return next(AppError.forbidden('Accès interdit', { orderId: id, userId: req.user.id }));
    }

    const response = { order };

    // Stocker dans le cache (5 minutes)
    await cacheService.set(cacheKey, response, cacheService.TTL.ORDER_DETAIL);
    logger.debug('Cache set pour getOrder', { cacheKey });

    res.json(response);
  } catch (err) {
    logger.error('Erreur lecture commande', { message: err.message, stack: err.stack });
    next(err);
  }
}

async function listOrders(req, res, next) {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = {
      $or: [{ customer_id: req.user.id }, { deliverer_id: req.user.id }],
    };
    if (status) filter.status = status;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Générer la clé de cache
    const cacheKey = cacheService.getOrderCacheKey(req.user.id, status);

    // Essayer de récupérer depuis le cache
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.debug('Cache hit pour listOrders', { cacheKey });
      return res.json(cached);
    }

    const [orders, total] = await Promise.all([
      Commande.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate({
          path: 'deliverer_id',
          select: 'personalInfo.firstName personalInfo.lastName',
        }),
      Commande.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    const response = {
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    };

    // Stocker dans le cache (5 minutes)
    await cacheService.set(cacheKey, response, cacheService.TTL.ORDERS);
    logger.debug('Cache set pour listOrders', { cacheKey });

    res.json(response);
  } catch (err) {
    logger.error('Erreur liste commandes', { message: err.message, stack: err.stack });
    next(err);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, note } = req.validated.body;

    const order = await Commande.findById(id);
    if (!order) {
      return next(AppError.notFound('Commande introuvable', { id }));
    }

    // Vérifier que l'utilisateur a le droit de modifier le statut
    let restaurantOwnerId = null;
    if (req.user.role === 'VENDOR' || req.user.role === 'ADMIN') {
      const restaurant = await Restaurant.findById(order.restaurant_id).select('owner_id');
      restaurantOwnerId = restaurant?.owner_id?.toString();
    }

    const isOrderCustomer = order.customer_id.toString() === req.user.id;
    const isOrderDeliverer = order.deliverer_id?.toString() === req.user.id;
    const isOrderVendor = restaurantOwnerId && restaurantOwnerId === req.user.id;

    if (!isOrderCustomer && !isOrderDeliverer && !isOrderVendor && req.user.role !== 'ADMIN') {
      return next(AppError.forbidden('Accès interdit', { orderId: id, userId: req.user.id }));
    }

    // Valider la transition de statut
    if (!isValidTransition(order.status, status)) {
      return next(
        AppError.badRequest(`Transition de statut invalide: ${order.status} → ${status}`, {
          currentStatus: order.status,
          requestedStatus: status,
        })
      );
    }

    // Ajouter la transition à l'historique
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || null,
    });

    // Mettre à jour le statut
    order.status = status;
    order.metadata.updatedAt = new Date();

    await order.save();

    // Invalider le cache
    await cacheService.del(cacheService.getOrderDetailCacheKey(id));
    await cacheService.invalidate(`orders:user:${order.customer_id}*`);
    if (order.deliverer_id) {
      await cacheService.invalidate(`orders:user:${order.deliverer_id}*`);
    }
    if (restaurantOwnerId) {
      await cacheService.invalidate(`orders:user:${restaurantOwnerId}*`);
    }
    logger.debug('Cache invalidé pour updateOrderStatus', { orderId: id });

    const payload = {
      orderId: id,
      status,
      note,
      timestamp: new Date(),
    };

    // Émettre le nouveau statut via Socket.io à la room de la commande
    emitToRoom(`order:${id}`, 'order:status:updated', payload);
    emitToUser(order.customer_id.toString(), 'order:status:updated', payload);
    if (order.deliverer_id) {
      emitToUser(order.deliverer_id.toString(), 'order:status:updated', payload);
    }
    if (restaurantOwnerId) {
      emitToUser(restaurantOwnerId, 'order:status:updated', payload);
    }
    logger.debug('Statut commande émis via Socket.io', { orderId: id, status });

    res.json({ order });
  } catch (err) {
    logger.error('Erreur mise à jour statut commande', { message: err.message, stack: err.stack });
    next(err);
  }
}

async function assignDeliverer(req, res, next) {
  try {
    const { id } = req.params;
    const { delivererId } = req.validated.body;

    const order = await Commande.findById(id);
    if (!order) {
      return next(AppError.notFound('Commande introuvable', { id }));
    }

    const restaurant = await Restaurant.findById(order.restaurant_id);
    if (!restaurant || restaurant.owner_id.toString() !== req.user.id) {
      return next(AppError.forbidden('Vous n’avez pas le droit d’assigner un livreur à cette commande', { orderId: id }));
    }

    const deliverer = await Deliverer.findById(delivererId);
    if (!deliverer) {
      return next(AppError.notFound('Livreur introuvable', { delivererId }));
    }

    if (!deliverer.isAvailable || !deliverer.isActive) {
      return next(AppError.badRequest('Livreur non disponible', { delivererId }));
    }

    // Assigner ou réaffecter le livreur
    order.deliverer_id = delivererId;
    order.metadata.updatedAt = new Date();

    await order.save();

    // Invalider le cache
    await cacheService.del(cacheService.getOrderDetailCacheKey(id));
    await cacheService.invalidate(`orders:user:${order.customer_id}*`);
    await cacheService.invalidate(`orders:user:${delivererId}*`);
    if (restaurant?.owner_id) {
      await cacheService.invalidate(`orders:user:${restaurant.owner_id}*`);
    }
    logger.debug('Cache invalidé pour assignDeliverer', { orderId: id, delivererId });

    const payload = {
      orderId: id,
      delivererId,
      delivererName: deliverer.profile?.firstName || 'Livreur',
      timestamp: new Date(),
    };

    // Émettre l'assignation via Socket.io à la room de la commande
    emitToRoom(`order:${id}`, 'order:deliverer:assigned', payload);
    emitToUser(order.customer_id.toString(), 'order:deliverer:assigned', payload);
    emitToUser(delivererId.toString(), 'order:deliverer:assigned', payload);
    if (restaurant?.owner_id) {
      emitToUser(restaurant.owner_id.toString(), 'order:deliverer:assigned', payload);
    }
    logger.debug('Assignation livreur émise via Socket.io', { orderId: id, delivererId });

    res.json({ order });
  } catch (err) {
    logger.error('Erreur assignation livreur', { message: err.message, stack: err.stack });
    next(err);
  }
}

async function deleteOrder(req, res, next) {
  try {
    const { id } = req.params;

    const order = await Commande.findById(id);
    if (!order) {
      return next(AppError.notFound('Commande introuvable', { id }));
    }

    // Seul le client peut supprimer sa propre commande
    if (order.customer_id.toString() !== req.user.id) {
      return next(AppError.forbidden('Accès interdit', { orderId: id, userId: req.user.id }));
    }

    // Seules les commandes en PENDING peuvent être supprimées
    if (order.status !== 'PENDING') {
      return next(
        AppError.badRequest('Seules les commandes en PENDING peuvent être supprimées', {
          currentStatus: order.status,
        })
      );
    }

    await Commande.findByIdAndDelete(id);

    // Invalider le cache
    await cacheService.del(cacheService.getOrderDetailCacheKey(id));
    await cacheService.invalidate(`orders:user:${order.customer_id}*`);
    logger.debug('Cache invalidé pour deleteOrder', { orderId: id });

    res.status(204).send();
  } catch (err) {
    logger.error('Erreur suppression commande', { message: err.message, stack: err.stack });
    next(err);
  }
}

module.exports = {
  createOrder,
  getOrder,
  listOrders,
  updateOrderStatus,
  assignDeliverer,
  deleteOrder,
};
