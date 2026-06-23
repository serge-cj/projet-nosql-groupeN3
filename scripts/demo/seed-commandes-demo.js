/**
 * Seed commandes for soutenance demo (aggregation + explain).
 * Requires: npm run seed (users, restaurants, deliverers) first.
 *
 * Usage: node scripts/demo/seed-commandes-demo.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { User, Restaurant, Deliverer, Commande } = require('../../src/models');

const STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_DELIVERY',
  'DELIVERY_IN_PROGRESS',
  'DELIVERED',
  'CANCELLED',
];

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function buildStatusHistory(finalStatus) {
  const flow = [
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'READY_FOR_DELIVERY',
    'DELIVERY_IN_PROGRESS',
    'DELIVERED',
  ];
  const endIndex = flow.indexOf(finalStatus);
  const steps = endIndex >= 0 ? flow.slice(0, endIndex + 1) : ['PENDING', 'CANCELLED'];

  const base = Date.now() - randomInt(1, 72) * 3600000;
  return steps.map((status, i) => ({
    status,
    timestamp: new Date(base + i * randomInt(3, 15) * 60000),
    note: i === 0 ? 'Commande créée' : `Transition vers ${status}`,
  }));
}

function buildGpsTrail(startCoords, points = 5) {
  const [lng, lat] = startCoords;
  const trail = [];
  const base = Date.now() - points * 60000;

  for (let i = 0; i < points; i++) {
    trail.push({
      timestamp: new Date(base + i * 60000),
      coordinates: {
        type: 'Point',
        coordinates: [lng + i * 0.002, lat + i * 0.001],
      },
      speed: randomInt(15, 45),
      distance: Number((i * 0.4).toFixed(2)),
    });
  }

  return trail;
}

async function seedCommandes() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/libreville_eats';
  await mongoose.connect(mongoUri);

  const customers = await User.find({ role: 'CUSTOMER' }).limit(5);
  const restaurants = await Restaurant.find().limit(40);
  const deliverers = await Deliverer.find().limit(5);

  if (customers.length === 0 || restaurants.length === 0) {
    throw new Error('Exécutez "npm run seed" avant pour créer utilisateurs et restaurants.');
  }

  await Commande.deleteMany({});

  const commandes = [];

  for (let i = 0; i < 45; i++) {
    const restaurant = randomChoice(restaurants);
    const customer = randomChoice(customers);
    const dish = randomChoice(restaurant.menus[0]?.dishes || []);
    const quantity = randomInt(1, 3);
    const unitPrice = dish?.price || randomInt(1500, 5000);
    const subtotal = unitPrice * quantity;
    const deliveryFee = randomChoice(restaurant.deliveryZones)?.deliveryFee || 1000;
    const tax = Math.round(subtotal * 0.12);
    const total = subtotal + deliveryFee + tax;
    const status = randomChoice(STATUSES);
    const needsDeliverer = [
      'DELIVERY_IN_PROGRESS',
      'DELIVERED',
      'READY_FOR_DELIVERY',
    ].includes(status);

    const createdAt = new Date(Date.now() - randomInt(1, 30) * 86400000);
    const statusHistory = buildStatusHistory(status);

    commandes.push({
      customer_id: customer._id,
      restaurant_id: restaurant._id,
      deliverer_id: needsDeliverer ? randomChoice(deliverers)._id : null,
      items: [
        {
          dishId: dish?._id,
          dishName: dish?.name || 'Poulet Nyembwe',
          quantity,
          unitPrice,
          totalPrice: subtotal,
        },
      ],
      pricing: {
        subtotal,
        deliveryFee,
        discount: 0,
        tax,
        total,
        currency: 'FCFA',
      },
      status,
      statusHistory,
      deliveryTracking:
        status === 'DELIVERY_IN_PROGRESS' || status === 'DELIVERED'
          ? buildGpsTrail(restaurant.address.coordinates.coordinates)
          : [],
      deliveryInfo: {
        type: 'DELIVERY',
        address: {
          street: `Avenue Bessieux ${randomInt(1, 120)}`,
          district: restaurant.address.district,
          city: 'Libreville',
        },
        recipientName: `${customer.profile.firstName} ${customer.profile.lastName}`,
        recipientPhone: customer.profile.phone,
        actualDeliveryTime: status === 'DELIVERED' ? new Date() : null,
      },
      payment: {
        method: randomChoice(['CASH', 'MOBILE_MONEY', 'CARD']),
        status: status === 'DELIVERED' ? 'COMPLETED' : 'PENDING',
      },
      metadata: { createdAt, updatedAt: new Date() },
      createdAt,
      updatedAt: new Date(),
    });
  }

  await Commande.insertMany(commandes);

  const preparingCount = await Commande.countDocuments({ status: 'PREPARING' });

  console.log(`✅ ${commandes.length} commandes insérées`);
  console.log(`   • PREPARING (pour explain): ${preparingCount}`);
  console.log(`   • Restaurants liés: ${restaurants.length}`);

  await mongoose.disconnect();
}

if (require.main === module) {
  seedCommandes().catch((err) => {
    console.error('❌', err.message);
    process.exit(1);
  });
}

module.exports = { seedCommandes };
