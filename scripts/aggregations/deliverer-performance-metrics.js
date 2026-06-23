const {
  connectDatabase,
  disconnectDatabase,
} = require('../../src/config/database');
const { Commande, Deliverer } = require('../../src/models');
const { logger } = require('../../src/utils/logger');

async function run() {
  try {
    await connectDatabase();

    const pipeline = [
      {
        $group: {
          _id: '$deliverer_id',
          totalDeliveries: {
            $sum: {
              $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0],
            },
          },
          totalRevenue: { $sum: '$pricing.total' },
          averageOrderValue: { $avg: '$pricing.total' },
          pendingOrders: {
            $sum: {
              $cond: [{ $in: ['$status', ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_DELIVERY', 'DELIVERY_IN_PROGRESS']] }, 1, 0],
            },
          },
          cancelledOrders: {
            $sum: {
              $cond: [{ $in: ['$status', ['CANCELLED', 'FAILED']] }, 1, 0],
            },
          },
          averageDeliveryTime: {
            $avg: {
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
                null,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'deliverers',
          localField: '_id',
          foreignField: '_id',
          as: 'deliverer',
        },
      },
      {
        $unwind: {
          path: '$deliverer',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          delivererId: '$_id',
          email: '$deliverer.personalInfo.email',
          name: {
            $concat: [
              '$deliverer.personalInfo.firstName',
              ' ',
              '$deliverer.personalInfo.lastName',
            ],
          },
          vehicleType: '$deliverer.vehicleInfo.type',
          isAvailable: '$deliverer.isAvailable',
          totalDeliveries: 1,
          totalRevenue: 1,
          averageOrderValue: 1,
          pendingOrders: 1,
          cancelledOrders: 1,
          averageDeliveryTime: 1,
        },
      },
      { $sort: { totalDeliveries: -1 } },
    ];

    const metrics = await Commande.aggregate(pipeline);

    logger.info('Deliverer performance metrics computed', { count: metrics.length });

    if (metrics.length === 0) {
      logger.warn('No deliverer performance metrics were found.');
    }

    console.table(
      metrics.map((row) => ({
        delivererId: row.delivererId?.toString() || 'unknown',
        name: row.name || 'Unknown',
        email: row.email || 'Unknown',
        vehicleType: row.vehicleType || 'Unknown',
        totalDeliveries: row.totalDeliveries,
        totalRevenue: row.totalRevenue,
        avgOrderValue: Number(row.averageOrderValue.toFixed(2)),
        pendingOrders: row.pendingOrders,
        cancelledOrders: row.cancelledOrders,
        averageDeliveryTime: row.averageDeliveryTime
          ? Number(row.averageDeliveryTime.toFixed(2))
          : null,
      })),
    );
  } catch (err) {
    logger.error('Échec du calcul des métriques livreurs', {
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
