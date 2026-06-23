const restaurantStats = require('./restaurant-order-stats');
const delivererMetrics = require('./deliverer-performance-metrics');
const revenueAnalysis = require('./revenue-analysis');

async function runAll() {
  try {
    await restaurantStats();
    await delivererMetrics();
    await revenueAnalysis();
    process.exit(0);
  } catch (err) {
    console.error('Échec de l\'exécution des agrégations', err);
    process.exit(1);
  }
}

if (require.main === module) {
  runAll();
}

module.exports = runAll;
