const Deliverer = require('../models/Deliverer');
const Commande = require('../models/Commande');
const Restaurant = require('../models/Restaurant');
const { logger } = require('../utils/logger');
const AppError = require('../utils/AppError');
const { emitToRoom } = require('../socket');
const { haversineDistanceKm } = require('../utils/geo');

// Pousse une position horodatée dans le tableau deliveryTracking de la
// commande en cours de livraison par ce livreur (défi technique du thème :
// suivi GPS du livreur pendant la course).
async function trackActiveOrderDelivery(delivererId, lat, lng) {
  const activeOrder = await Commande.findOne({
    deliverer_id: delivererId,
    status: 'DELIVERY_IN_PROGRESS',
  });

  if (!activeOrder) return null;

  const newPoint = [parseFloat(lng), parseFloat(lat)];
  const restaurant = await Restaurant.findById(activeOrder.restaurant_id).select(
    'address.coordinates'
  );
  const restaurantCoords = restaurant?.address?.coordinates?.coordinates;
  const distance = restaurantCoords
    ? Number(haversineDistanceKm(restaurantCoords, newPoint).toFixed(2))
    : null;

  const lastPoint = activeOrder.deliveryTracking[activeOrder.deliveryTracking.length - 1];
  let speed = null;
  if (lastPoint?.timestamp && lastPoint.coordinates?.coordinates) {
    const hours = (Date.now() - new Date(lastPoint.timestamp).getTime()) / 3600000;
    if (hours > 0) {
      const segmentKm = haversineDistanceKm(lastPoint.coordinates.coordinates, newPoint);
      speed = Number((segmentKm / hours).toFixed(1));
    }
  }

  await Commande.updateOne(
    { _id: activeOrder._id },
    {
      $push: {
        deliveryTracking: {
          timestamp: new Date(),
          coordinates: { type: 'Point', coordinates: newPoint },
          distance,
          speed,
        },
      },
    }
  );

  emitToRoom(`order:${activeOrder._id}`, 'order:tracking:updated', {
    orderId: activeOrder._id,
    lat,
    lng,
    distance,
    speed,
    timestamp: new Date(),
  });

  return activeOrder._id;
}

async function listAvailableDeliverers(req, res, next) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const filter = { isAvailable: true, isActive: true };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [deliverers, total] = await Promise.all([
      Deliverer.find(filter).skip(skip).limit(limitNum),
      Deliverer.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      deliverers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
  } catch (err) {
    logger.error('Erreur liste livreurs', { message: err.message, stack: err.stack });
    next(err);
  }
}

async function getDeliverer(req, res, next) {
  try {
    const { id } = req.params;
    const deliverer = await Deliverer.findById(id);
    if (!deliverer) {
      return next(AppError.notFound('Livreur introuvable', { id }));
    }
    res.json({ deliverer });
  } catch (err) {
    logger.error('Erreur lecture livreur', { message: err.message, stack: err.stack });
    next(err);
  }
}

async function updateDelivererLocation(req, res, next) {
  try {
    const { id } = req.params;
    const { lat, lng } = req.validated.body;

    const deliverer = await Deliverer.findById(id);
    if (!deliverer) {
      return next(AppError.notFound('Livreur introuvable', { id }));
    }

    // Vérifier que l'utilisateur est le livreur lui-même ou un admin
    if (deliverer._id.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return next(AppError.forbidden('Accès interdit', { delivererId: id, userId: req.user.id }));
    }

    // Mettre à jour la position
    deliverer.currentLocation = {
      type: 'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)],
    };
    deliverer.metadata.updatedAt = new Date();

    await deliverer.save();

    // Émettre la position GPS via Socket.io à la room du livreur
    emitToRoom(`deliverer:${id}`, 'location:updated', {
      delivererId: id,
      lat,
      lng,
      timestamp: new Date(),
    });

    // Si une livraison est en cours, alimenter le suivi GPS de la commande
    const trackedOrderId = await trackActiveOrderDelivery(id, lat, lng);
    if (trackedOrderId) {
      logger.debug('Position GPS ajoutée au suivi de la commande', {
        delivererId: id,
        orderId: trackedOrderId,
      });
    }

    logger.debug('Position GPS émise via Socket.io', { delivererId: id, lat, lng });

    res.json({ deliverer });
  } catch (err) {
    logger.error('Erreur mise à jour position livreur', { message: err.message, stack: err.stack });
    next(err);
  }
}

module.exports = {
  listAvailableDeliverers,
  getDeliverer,
  updateDelivererLocation,
};
