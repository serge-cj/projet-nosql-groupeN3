const {
  connectDatabase,
  disconnectDatabase,
} = require('../../src/config/database');
const { Commande } = require('../../src/models');
const { logger } = require('../../src/utils/logger');

async function run() {
  try {
    await connectDatabase();

    const pipeline = [
      {
        $group: {
          _id: '$restaurant_id',
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.total' },
          avgOrderValue: { $avg: '$pricing.total' },
          deliveredOrders: {
            $sum: {
              $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0],
            },
          },
          cancelledOrders: {
            $sum: {
              $cond: [
                { $in: ['$status', ['CANCELLED', 'FAILED']] },
                1,
                0,
              ],
            },
          },
          deliveryTimeTotal: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$deliveryInfo.actualDeliveryTime', null] },
                    { $ne: ['$metadata.createdAt', null] },
                  ],
                },
                {
                  $divide: [
                    {
                      $subtract: [
                        '$deliveryInfo.actualDeliveryTime',
                        '$metadata.createdAt',
                      ],
                    },
                    60000,
                  ],
                },
                0,
              ],
            },
          },
        },
      },
      {
        $addFields: {
          averageDeliveryTime: {
            $cond: [
              { $gt: ['$deliveredOrders', 0] },
              { $divide: ['$deliveryTimeTotal', '$deliveredOrders'] },
              null,
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'restaurants',
          localField: '_id',
          foreignField: '_id',
          as: 'restaurant',
        },
      },
      {
        $unwind: {
          path: '$restaurant',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          restaurantId: '$_id',
          restaurantName: '$restaurant.name',
          district: '$restaurant.address.district',
          orderCount: 1,
          totalRevenue: 1,
          avgOrderValue: 1,
          deliveredOrders: 1,
          cancelledOrders: 1,
          averageDeliveryTime: 1,
        },
      },
      { $sort: { totalRevenue: -1 } },
    ];

    const stats = await Commande.aggregate(pipeline);

    logger.info('Statistiques commandes par restaurant calculées', { count: stats.length });

    if (stats.length === 0) {
      logger.warn('Aucune statistique de commande trouvée.');
    }

    console.table(
      stats.map((row) => ({
        restaurantId: row.restaurantId?.toString() || 'unknown',
        restaurantName: row.restaurantName || 'Unknown',
        district: row.district || 'Unknown',
        orderCount: row.orderCount,
        totalRevenue: row.totalRevenue,
        avgOrderValue: Number(row.avgOrderValue.toFixed(2)),
        deliveredOrders: row.deliveredOrders,
        cancelledOrders: row.cancelledOrders,
        averageDeliveryTime: row.averageDeliveryTime
          ? Number(row.averageDeliveryTime.toFixed(2))
          : null,
      })),
    );
  } catch (err) {
    logger.error('Échec du calcul des statistiques restaurants', {
      message: err.message,
      stack: err.stack,
    });
    throw err;
  } finally {
    await disconnectDatabase();
  }
}

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = run;
