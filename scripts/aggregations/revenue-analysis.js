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
        $facet: {
          totalRevenueByMonth: [
            {
              $match: {
                'payment.status': 'COMPLETED',
              },
            },
            {
              $group: {
                _id: {
                  year: { $year: '$metadata.createdAt' },
                  month: { $month: '$metadata.createdAt' },
                },
                revenue: { $sum: '$pricing.total' },
                orderCount: { $sum: 1 },
                averageOrderValue: { $avg: '$pricing.total' },
              },
            },
            {
              $sort: {
                '_id.year': 1,
                '_id.month': 1,
              },
            },
            {
              $project: {
                year: '$_id.year',
                month: '$_id.month',
                revenue: 1,
                orderCount: 1,
                averageOrderValue: { $round: ['$averageOrderValue', 2] },
                _id: 0,
              },
            },
          ],
          revenueByRestaurant: [
            {
              $match: {
                'payment.status': 'COMPLETED',
              },
            },
            {
              $group: {
                _id: '$restaurant_id',
                revenue: { $sum: '$pricing.total' },
                orderCount: { $sum: 1 },
                averageOrderValue: { $avg: '$pricing.total' },
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
                revenue: 1,
                orderCount: 1,
                averageOrderValue: { $round: ['$averageOrderValue', 2] },
              },
            },
            {
              $sort: {
                revenue: -1,
              },
            },
          ],
          revenueByPaymentMethod: [
            {
              $match: {
                'payment.status': 'COMPLETED',
              },
            },
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
            {
              $sort: {
                revenue: -1,
              },
            },
          ],
        },
      },
      {
        $project: {
          totalRevenueByMonth: 1,
          revenueByRestaurant: 1,
          revenueByPaymentMethod: 1,
        },
      },
    ];

    const [result] = await Commande.aggregate(pipeline);

    logger.info('Revenue analysis computed');

    const formatTable = (title, rows) => {
      logger.info(`\n${title}`);
      if (!rows || rows.length === 0) {
        logger.warn('No data for', { title });
        return;
      }
      console.table(rows);
    };

    formatTable('Total Revenue by Month', result.totalRevenueByMonth);
    formatTable('Revenue by Restaurant', result.revenueByRestaurant);
    formatTable('Revenue by Payment Method', result.revenueByPaymentMethod);
  } catch (err) {
    logger.error('Échec de l\'analyse des revenus', {
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
