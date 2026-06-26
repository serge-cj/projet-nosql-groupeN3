const mongoose = require('mongoose');
require('dotenv').config();

const config = require('../../src/config');
const { User, Restaurant, Deliverer } = require('../../src/models');
const gabanData = require('../data/gabon-data');

const { logger } = require('../../src/utils/logger');

// Extract data
const {
  DISTRICTS,
  PHONE_GENERATORS,
  DELIVERY_ZONES,
  DISTRICT_COORDINATES,
  FIRST_NAMES,
  LAST_NAMES,
  REAL_RESTAURANTS,
} = gabanData;

// Utilities
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Mot de passe en clair pour tous les comptes de démo, volontairement laissé
// lisible ici (et affiché dans le résumé en fin de seed) pour pouvoir se
// connecter à n'importe quel compte pendant la présentation. Le hook
// pre('save') de User (src/models/User.js) le hache automatiquement à
// l'insertion : la connexion via /api/auth/login (bcrypt.compare) fonctionne
// normalement.
const CLEAR_PASSWORD = 'TestPass123';

// Prénom/nom gabonais déterministes (évite les doublons de Math.random sur
// 30 comptes) — combine FIRST_NAMES x LAST_NAMES par décalage.
const gabonName = (index) => ({
  firstName: FIRST_NAMES[index % FIRST_NAMES.length],
  lastName: LAST_NAMES[(index * 7 + 3) % LAST_NAMES.length],
});

/**
 * Generate realistic Gabon-localized users
 */
async function seedUsers() {
  logger.info('📝 Insertion des utilisateurs...');

  const users = [];

  // 30 comptes clients (noms gabonais)
  for (let i = 0; i < 30; i++) {
    const { firstName, lastName } = gabonName(i);

    users.push({
      email: `customer${i + 1}@librevilleeats.ga`,
      password: CLEAR_PASSWORD,
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

  // 30 comptes vendeurs — un par restaurant réel (REAL_RESTAURANTS), noms gabonais
  for (let i = 0; i < REAL_RESTAURANTS.length; i++) {
    const { firstName, lastName } = gabonName(i + 30);
    const slug = REAL_RESTAURANTS[i].name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    users.push({
      email: `vendor-${slug}@librevilleeats.ga`,
      password: CLEAR_PASSWORD,
      role: 'VENDOR',
      profile: {
        firstName,
        lastName,
        phone: PHONE_GENERATORS.generatePhone(),
      },
      emailVerified: true,
    });
  }

  // 30 comptes livreurs (noms gabonais)
  for (let i = 0; i < 30; i++) {
    const { firstName, lastName } = gabonName(i + 60);

    users.push({
      email: `deliverer${i + 1}@librevilleeats.ga`,
      password: CLEAR_PASSWORD,
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
  logger.info(`✅ ${createdUsers.length} utilisateurs créés (mot de passe en clair pour tous : ${CLEAR_PASSWORD})`);

  return createdUsers;
}

/**
 * Insère les 30 restaurants réels de Libreville/Akanda/Owendo
 * (scripts/data/gabon-data.js -> REAL_RESTAURANTS), chacun avec son menu
 * réel et ses propres horaires/coordonnées/coordonnées de contact.
 * Un vendeur par restaurant (vendors[i] créé dans le même ordre dans
 * seedUsers() — voir la boucle "comptes vendeurs").
 */
async function seedRestaurants(vendors) {
  logger.info('🏪 Insertion des restaurants...');

  const restaurants = REAL_RESTAURANTS.map((r, i) => {
    // 10 à 15% des plats de CHAQUE restaurant en rupture de stock — avec
    // 10 plats par restaurant, 1 plat (10%) tombe dans cette fourchette ;
    // l'indice varie par restaurant (i) pour ne pas toujours désactiver le
    // même plat (variété pour la démo).
    const outOfStockCount = Math.max(1, Math.round(r.dishes.length * 0.12));
    const outOfStockIndexes = new Set(
      Array.from({ length: outOfStockCount }, (_, k) => (i + k * 3) % r.dishes.length)
    );

    const dishes = r.dishes.map((d, j) => {
      const outOfStock = outOfStockIndexes.has(j);
      return {
        name: d.name,
        price: d.price,
        currency: 'FCFA',
        category: d.category,
        isAvailable: !outOfStock,
        quantity: outOfStock ? 0 : randomInt(20, 100),
        preparationTime: randomInt(8, 30),
      };
    });

    return {
      name: r.name,
      email: r.email,
      phone: r.phone,
      address: {
        street: r.street,
        district: r.district,
        city: 'Libreville',
        coordinates: { type: 'Point', coordinates: r.coordinates },
      },
      hours: r.hours,
      // 18 restaurants sur 30 fermés (variété pour la démo des filtres
      // isOpen / GET /api/restaurants?isOpen=...) — répartis sur chaque
      // tranche de 10 plutôt que regroupés par enseigne.
      isOpen: (i % 10) >= 6,
      rating: parseFloat((randomInt(35, 50) / 10).toFixed(1)),
      reviewCount: randomInt(50, 300),
      menus: [
        {
          name: 'Menu',
          description: r.hoursText,
          dishes,
        },
      ],
      deliveryZones: DELIVERY_ZONES,
      owner_id: vendors[i]._id,
    };
  });

  const createdRestaurants = await Restaurant.insertMany(restaurants);
  logger.info(`✅ ${createdRestaurants.length} restaurants créés avec menus réels`);

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
    const restaurants = await seedRestaurants(vendors);

    // Seed deliverers
    await seedDeliverers(delivererUsers);

    logger.info(
      '✅ Peuplement de la base terminé ! 🎉\n' +
        `\n📊 Résumé :\n` +
        `  • Utilisateurs : ${allUsers.length} (30 clients, ${vendors.length} restaurateurs [1 par restaurant], ${delivererUsers.length} livreurs)\n` +
        `  • Restaurants : ${restaurants.length} (enseignes réelles de Libreville/Akanda/Owendo, avec menus et plats réels)\n` +
        `\n🔐 Mot de passe en clair pour TOUS les comptes de démo : ${CLEAR_PASSWORD}\n` +
        `   (haché automatiquement à l'insertion par User.pre('save') — la connexion via /api/auth/login fonctionne normalement)\n` +
        `\n   Exemples de connexion :\n` +
        `  • Client      : customer1@librevilleeats.ga / ${CLEAR_PASSWORD}\n` +
        `  • Restaurateur : ${vendors[0].email} / ${CLEAR_PASSWORD}\n` +
        `  • Livreur     : deliverer1@librevilleeats.ga / ${CLEAR_PASSWORD}\n` +
        `  (les ${vendors.length} comptes restaurateurs sont vendor-<nom-du-restaurant>@librevilleeats.ga)\n`
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
