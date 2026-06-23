const mongoose = require('mongoose');
require('dotenv').config();

const config = require('../../src/config');
const { User, Restaurant, Deliverer } = require('../../src/models');
const gabanData = require('../data/gabon-data');

const { logger } = require('../../src/utils/logger');

// Extract data
const {
  DISTRICTS,
  GABON_DISHES,
  PHONE_GENERATORS,
  RESTAURANT_NAMES,
  DELIVERY_ZONES,
  OPERATING_HOURS,
  DISTRICT_COORDINATES,
  FIRST_NAMES,
  LAST_NAMES,
} = gabanData;

// Utilities
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Generate realistic Gabon-localized users
 */
async function seedUsers() {
  logger.info('📝 Insertion des utilisateurs...');

  const users = [];

  // Create 5 customer accounts
  for (let i = 0; i < 5; i++) {
    const firstName = randomChoice(FIRST_NAMES);
    const lastName = randomChoice(LAST_NAMES);

    users.push({
      email: `customer${i + 1}@librevilleeats.ga`,
      password: 'TestPass123', // Will be hashed
      role: 'CUSTOMER',
      profile: {
        firstName,
        lastName,
        phone: PHONE_GENERATORS.generatePhone(),
      },
      addresses: [
        {
          label: 'HOME',
          street: `Avenue ${randomChoice(['de l\'Indépendance', 'Bessieux', 'de la Gare'])}`,
          district: randomChoice(Object.values(DISTRICTS)),
          city: 'Libreville',
          coordinates: {
            type: 'Point',
            coordinates: randomChoice(Object.values(DISTRICT_COORDINATES)),
          },
          isDefault: true,
        },
      ],
      emailVerified: true,
    });
  }

  // Create 3 vendor accounts
  for (let i = 0; i < 3; i++) {
    const firstName = randomChoice(FIRST_NAMES);
    const lastName = randomChoice(LAST_NAMES);

    users.push({
      email: `vendor${i + 1}@librevilleeats.ga`,
      password: 'TestPass123',
      role: 'VENDOR',
      profile: {
        firstName,
        lastName,
        phone: PHONE_GENERATORS.generatePhone(),
      },
      emailVerified: true,
    });
  }

  // Create 5 deliverer accounts
  for (let i = 0; i < 5; i++) {
    const firstName = randomChoice(FIRST_NAMES);
    const lastName = randomChoice(LAST_NAMES);

    users.push({
      email: `deliverer${i + 1}@librevilleeats.ga`,
      password: 'TestPass123',
      role: 'DELIVERER',
      profile: {
        firstName,
        lastName,
        phone: PHONE_GENERATORS.generatePhone(),
      },
      emailVerified: true,
    });
  }

  // Save users (using create() to ensure pre-save hooks hash passwords)
  const createdUsers = await Promise.all(
    users.map((userData) => User.create(userData))
  );
  logger.info(`✅ ${createdUsers.length} utilisateurs créés`);

  return createdUsers;
}

/**
 * Generate realistic Gabon-localized restaurants with embedded menus
 */
async function seedRestaurants(vendors) {
  logger.info('🏪 Insertion des restaurants...');

  const restaurants = [];

  for (let i = 0; i < 3; i++) {
    const district = randomChoice(Object.values(DISTRICTS));
    const coordinates = DISTRICT_COORDINATES[district] || [9.4583, 0.4162];

    // Create 1-2 menus per restaurant
    const menus = [];
    const menuNames = ['Menu Principal', 'Menu Spécial', 'Promotion du Jour'];

    for (let j = 0; j < randomInt(1, 2); j++) {
      const selectedDishes = [];
      const dishCount = randomInt(8, 12);

      // Select random dishes
      for (let k = 0; k < dishCount; k++) {
        const baseDish = randomChoice(GABON_DISHES);
        selectedDishes.push({
          ...baseDish,
          isAvailable: Math.random() > 0.1, // 90% available
          quantity: randomInt(20, 100),
        });
      }

      menus.push({
        name: menuNames[j],
        description: `Menu de qualité depuis Libreville`,
        dishes: selectedDishes,
      });
    }

    restaurants.push({
      name: randomChoice(RESTAURANT_NAMES),
      email: `restaurant${i + 1}@librevilleeats.ga`,
      phone: PHONE_GENERATORS.generatePhone(),
      address: {
        street: `Rue ${randomChoice(['Principale', 'Commerciale', 'des Cuisines'])}`,
        district,
        city: 'Libreville',
        zipCode: `BP ${1000 + i}`,
        coordinates: {
          type: 'Point',
          coordinates,
        },
      },
      hours: OPERATING_HOURS,
      isOpen: true,
      rating: parseFloat((randomInt(35, 50) / 10).toFixed(1)),
      reviewCount: randomInt(50, 300),
      menus,
      deliveryZones: DELIVERY_ZONES,
      owner_id: vendors[i % vendors.length]._id,
    });
  }

  const createdRestaurants = await Restaurant.insertMany(restaurants);
  logger.info(`✅ ${createdRestaurants.length} restaurants créés avec menus`);

  return createdRestaurants;
}

/**
 * Generate realistic Gabon-localized deliverer profiles
 */
async function seedDeliverers(delivererUsers) {
  logger.info('🏍️ Insertion des livreurs...');

  const deliverers = [];
  const vehicleTypes = ['MOTORCYCLE', 'SCOOTER', 'BICYCLE'];

  for (let i = 0; i < delivererUsers.length; i++) {
    const user = delivererUsers[i];
    const district = randomChoice(Object.values(DISTRICTS));
    const coordinates = DISTRICT_COORDINATES[district] || [9.4583, 0.4162];

    deliverers.push({
      user_id: user._id,
      personalInfo: {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        phone: user.profile.phone,
        email: user.email,
        idCardNumber: `LA${2024}${String(i).padStart(6, '0')}`,
        idCardExpiry: new Date(2027, 12, 31),
      },
      vehicleInfo: {
        type: randomChoice(vehicleTypes),
        licensePlate: `LA2024${String(i).padStart(3, '0')}`,
        color: randomChoice(['Red', 'Blue', 'Yellow', 'Green', 'Black']),
        insuranceExpiry: new Date(2025, 12, 31),
      },
      currentLocation: {
        type: 'Point',
        coordinates,
        lastUpdated: new Date(),
      },
      isActive: true,
      isAvailable: Math.random() > 0.3, // 70% available
      performanceMetrics: {
        totalDeliveries: randomInt(50, 500),
        totalEarnings: randomInt(100000, 1000000),
        averageRating: parseFloat((randomInt(40, 50) / 10).toFixed(1)),
        ratingCount: randomInt(30, 200),
        cancelledDeliveries: randomInt(0, 10),
        averageDeliveryTime: randomInt(20, 35),
      },
      bankInfo: {
        accountHolder: `${user.profile.firstName} ${user.profile.lastName}`,
        bankName: randomChoice(['BGFI Bank Gabon', 'Societe Generale', 'Ecobank']),
        accountNumber: `${randomInt(1000000000, 9999999999)}`,
        iban: `GA61${randomInt(10000000, 99999999)}`,
      },
      documents: [
        {
          type: 'IDENTITY',
          url: 'https://example.com/id.jpg',
          verified: true,
          verifiedAt: new Date(),
        },
      ],
      availability: {
        monday: { available: true, startTime: '08:00', endTime: '22:00' },
        tuesday: { available: true, startTime: '08:00', endTime: '22:00' },
        wednesday: { available: true, startTime: '08:00', endTime: '22:00' },
        thursday: { available: true, startTime: '08:00', endTime: '22:00' },
        friday: { available: true, startTime: '08:00', endTime: '23:00' },
        saturday: { available: true, startTime: '09:00', endTime: '23:00' },
        sunday: { available: false },
      },
    });
  }

  const createdDeliverers = await Deliverer.insertMany(deliverers);
  logger.info(`✅ ${createdDeliverers.length} livreurs créés`);

  return createdDeliverers;
}

/**
 * Main seed function
 */
async function seedDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = config.mongodb.uri;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is required to seed the database');
    }
    logger.info(`Connexion à MongoDB: ${mongoUri.replace(/:[^@]*@/, ':****@')}`);

    await mongoose.connect(mongoUri, {
      retryWrites: true,
      w: 'majority',
    });

    logger.info('✅ Connecté à MongoDB');

    logger.info('🗑️ Nettoyage des données existantes...');
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await Deliverer.deleteMany({});

    // Seed users
    const allUsers = await seedUsers();
    const vendors = allUsers.filter((u) => u.role === 'VENDOR');
    const delivererUsers = allUsers.filter((u) => u.role === 'DELIVERER');

    // Seed restaurants
    await seedRestaurants(vendors);

    // Seed deliverers
    await seedDeliverers(delivererUsers);

    logger.info(
      '✅ Peuplement de la base terminé ! 🎉\n' +
        `\n📊 Résumé :\n` +
        `  • Utilisateurs : ${allUsers.length} (5 clients, 3 restaurateurs, 5 livreurs)\n` +
        `  • Restaurants : 3 (avec menus et plats)\n` +
        `  • Livreurs : 5\n` +
        `\n🔐 Comptes de test :\n` +
        `  • Client : customer1@librevilleeats.ga / TestPass123\n` +
        `  • Restaurateur : vendor1@librevilleeats.ga / TestPass123\n` +
        `  • Livreur : deliverer1@librevilleeats.ga / TestPass123\n`
    );

    await mongoose.disconnect();
    logger.info('Déconnecté de MongoDB');
  } catch (err) {
    logger.error('❌ Échec du peuplement', {
      message: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
}

// Run seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedUsers, seedRestaurants, seedDeliverers };
