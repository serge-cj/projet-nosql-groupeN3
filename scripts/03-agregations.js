// scripts/03-agregations.js
// Pipelines d'agrégation — $match, $group, $sort, $lookup.
// Repris (et simplifiés pour mongosh pur) des pipelines réellement utilisés
// par l'application : scripts/aggregations/*.js (exécutés via Mongoose dans
// l'app Node.js, ici réécrits en db.collection.aggregate() direct).
//
// Script mongosh autonome. Usage :
//   load("data/seed.js")
//   load("scripts/03-agregations.js")

print('\n=== 03-agregations.js ===\n');

// ---------- Pipeline 1 : statistiques de commandes par restaurant ----------
print('--- Statistiques de commandes par restaurant ---');
db.commandes
  .aggregate([
    {
      $group: {
        _id: '$restaurant_id',
        orderCount: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.total' },
        avgOrderValue: { $avg: '$pricing.total' },
        deliveredOrders: { $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] } },
        cancelledOrders: { $sum: { $cond: [{ $in: ['$status', ['CANCELLED', 'FAILED']] }, 1, 0] } },
      },
    },
    {
      $lookup: { from: 'restaurants', localField: '_id', foreignField: '_id', as: 'restaurant' },
    },
    { $unwind: { path: '$restaurant', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        restaurantName: '$restaurant.name',
        district: '$restaurant.address.district',
        orderCount: 1,
        totalRevenue: 1,
        avgOrderValue: { $round: ['$avgOrderValue', 2] },
        deliveredOrders: 1,
        cancelledOrders: 1,
      },
    },
    { $sort: { totalRevenue: -1 } },
  ])
  .forEach(printjson);

// ---------- Pipeline 2 : performance des livreurs ----------
print('\n--- Performance des livreurs ---');
db.commandes
  .aggregate([
    {
      $match: { deliverer_id: { $ne: null } },
    },
    {
      $group: {
        _id: '$deliverer_id',
        totalDeliveries: { $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] } },
        totalRevenue: { $sum: '$pricing.total' },
        averageOrderValue: { $avg: '$pricing.total' },
        cancelledOrders: { $sum: { $cond: [{ $in: ['$status', ['CANCELLED', 'FAILED']] }, 1, 0] } },
      },
    },
    {
      $lookup: { from: 'deliverers', localField: '_id', foreignField: '_id', as: 'deliverer' },
    },
    { $unwind: { path: '$deliverer', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: { $concat: ['$deliverer.personalInfo.firstName', ' ', '$deliverer.personalInfo.lastName'] },
        vehicleType: '$deliverer.vehicleInfo.type',
        totalDeliveries: 1,
        totalRevenue: 1,
        averageOrderValue: { $round: ['$averageOrderValue', 2] },
        cancelledOrders: 1,
      },
    },
    { $sort: { totalDeliveries: -1 } },
  ])
  .forEach(printjson);

// ---------- Pipeline 3 : analyse des revenus (par mois / restaurant / moyen de paiement) ----------
print('\n--- Analyse des revenus : par moyen de paiement ---');
db.commandes
  .aggregate([
    { $match: { 'payment.status': { $in: ['COMPLETED', 'PENDING'] } } },
    {
      $group: {
        _id: '$payment.method',
        revenue: { $sum: '$pricing.total' },
        orderCount: { $sum: 1 },
        averageOrderValue: { $avg: '$pricing.total' },
      },
    },
    {
      $project: {
        paymentMethod: '$_id',
        revenue: 1,
        orderCount: 1,
        averageOrderValue: { $round: ['$averageOrderValue', 2] },
        _id: 0,
      },
    },
    { $sort: { revenue: -1 } },
  ])
  .forEach(printjson);

print('\n--- Analyse des revenus : par restaurant ---');
db.commandes
  .aggregate([
    {
      $group: {
        _id: '$restaurant_id',
        revenue: { $sum: '$pricing.total' },
        orderCount: { $sum: 1 },
      },
    },
    { $lookup: { from: 'restaurants', localField: '_id', foreignField: '_id', as: 'restaurant' } },
    { $unwind: { path: '$restaurant', preserveNullAndEmptyArrays: true } },
    { $project: { restaurantName: '$restaurant.name', revenue: 1, orderCount: 1, _id: 0 } },
    { $sort: { revenue: -1 } },
  ])
  .forEach(printjson);

print('\n=== Fin 03-agregations.js ===\n');
