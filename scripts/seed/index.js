const mongoose = require('mongoose');
require('dotenv').config();

const config = require('../../src/config');
const { User, Restaurant, Deliverer } = require('../../src/models');
const gabanData = require('../data/gabon-data');
const { connectRedis, disconnectRedis } = require('../../src/config/redis');
const cacheService = require('../../src/services/cacheService');

const { logger } = require('../../src/utils/logger');

// Nous extrayons les données nécessaires
const {
  DISTRICTS,
  PHONE_GENERATORS,
  DELIVERY_ZONES,
  DISTRICT_COORDINATES,
  FIRST_NAMES,
  LAST_NAMES,
  REAL_RESTAURANTS,
} = gabanData;

// Fonctions utilitaires
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Nous utilisons un mot de passe en clair pour tous les comptes de démo, volontairement laissé
// lisible ici (et affiché dans le résumé en fin de seed) afin de pouvoir nous
// connecter à n'importe quel compte pendant la présentation. Nous rappelons que le hook
// pre('save') de User (src/models/User.js) le hache automatiquement à
// l'insertion : la connexion via /api/auth/login (bcrypt.compare) fonctionne
// normalement.
const CLEAR_PASSWORD = 'TestPass123';

// Nous générons des prénoms/noms gabonais de manière déterministe (afin d'éviter les doublons de Math.random sur
// 30 comptes) en combinant FIRST_NAMES x LAST_NAMES par décalage.
const gabonName = (index) => ({
  firstName: FIRST_NAMES[index % FIRST_NAMES.length],
  lastName: LAST_NAMES[(index * 7 + 3) % LAST_NAMES.length],
});

// Nous construisons l'adresse "nomprenom@librevilleeats.ga" sans accents/espaces, en gérant les doublons
// (les noms se répètent au-delà de 20 livreurs car FIRST_NAMES/LAST_NAMES
// n'ont que 20 entrées chacun) à l'aide d'un suffixe numérique sur les collisions.
const usedDelivererEmails = new Set();
const delivererEmail = (firstName, lastName) => {
  const base = `${firstName}${lastName}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');

  let local = base;
  let suffix = 2;
  while (usedDelivererEmails.has(local)) {
    local = `${base}${suffix}`;
    suffix += 1;
  }
  usedDelivererEmails.add(local);

  return `${local}@librevilleeats.ga`;
};

/**
 * Nous générons des utilisateurs réalistes localisés au Gabon.
 */
async function seedUsers() {
  logger.info('Insertion des utilisateurs...');

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
      email: delivererEmail(firstName, lastName),
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

  // Nous sauvegardons les utilisateurs (via create() afin que les hooks pre-save hachent les mots de passe)
  const createdUsers = await Promise.all(
    users.map((userData) => User.create(userData))
  );
  logger.info(`${createdUsers.length} utilisateurs créés (mot de passe en clair pour tous : ${CLEAR_PASSWORD})`);

  return createdUsers;
}

/**
 * Nous insérons les 30 restaurants réels de Libreville/Akanda/Owendo
 * (scripts/data/gabon-data.js -> REAL_RESTAURANTS), chacun avec son menu
 * réel et ses propres horaires/coordonnées/coordonnées de contact.
 * Nous associons un vendeur par restaurant (vendors[i] créé dans le même ordre dans
 * seedUsers() — voir la boucle "comptes vendeurs").
 */
async function seedRestaurants(vendors) {
  logger.info('Insertion des restaurants...');

  const restaurants = REAL_RESTAURANTS.map((r, i) => {
    // Nous mettons 10 à 15% des plats de CHAQUE restaurant en rupture de stock — avec
    // 10 plats par restaurant, 1 plat (10%) tombe dans cette fourchette ;
    // nous faisons varier l'indice par restaurant (i) pour ne pas toujours désactiver le
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
        image: d.image,
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
      // Nous fermons 18 restaurants sur 30 (variété pour la démo des filtres
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
  logger.info(`${createdRestaurants.length} restaurants créés avec menus réels`);

  return createdRestaurants;
}

/**
 * Nous générons des profils de livreurs réalistes localisés au Gabon.
 */
async function seedDeliverers(delivererUsers) {
  logger.info('Insertion des livreurs...');

  const deliverers = [];
  const vehicleTypes = ['MOTORCYCLE', 'SCOOTER', 'BICYCLE'];

  for (let i = 0; i < delivererUsers.length; i++) {
    const user = delivererUsers[i];
    const district = randomChoice(Object.values(DISTRICTS));
    const coordinates = DISTRICT_COORDINATES[district] || [9.4583, 0.4162];

    deliverers.push({
      _id: user._id,
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
      isAvailable: Math.random() > 0.3, // nous fixons un taux de disponibilité de 70%
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
  logger.info(`${createdDeliverers.length} livreurs créés`);

  return createdDeliverers;
}

/**
 * Nous définissons ici la fonction principale de peuplement de la base.
 */
async function seedDatabase() {
  try {
    // Nous nous connectons à MongoDB
    const mongoUri = config.mongodb.uri;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is required to seed the database');
    }
    logger.info(`Connexion à MongoDB: ${mongoUri.replace(/:[^@]*@/, ':****@')}`);

    await mongoose.connect(mongoUri, {
      retryWrites: true,
      w: 'majority',
    });

    logger.info('Connecté à MongoDB');

    logger.info('Nettoyage des données existantes...');
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await Deliverer.deleteMany({});

    // Nous peuplons les utilisateurs
    const allUsers = await seedUsers();
    const vendors = allUsers.filter((u) => u.role === 'VENDOR');
    const delivererUsers = allUsers.filter((u) => u.role === 'DELIVERER');

    // Nous peuplons les restaurants
    const restaurants = await seedRestaurants(vendors);

    // Nous peuplons les livreurs
    await seedDeliverers(delivererUsers);

    // Nous invalidons le cache Redis : sans cela, les anciennes réponses (ex. listes de
    // restaurants/total isOpen) restent servies jusqu'à expiration du TTL (1h) alors que
    // les données viennent de changer en base.
    await connectRedis();
    const invalidatedCount = await cacheService.invalidate('restaurants:*');
    await cacheService.invalidate('restaurant:*');
    await cacheService.invalidate('dishes:*');
    await disconnectRedis();
    logger.info(`Cache Redis invalidé (${invalidatedCount} clés "restaurants:*")`);

    logger.info(
      'Peuplement de la base terminé !\n' +
        `\nRésumé :\n` +
        `  • Utilisateurs : ${allUsers.length} (30 clients, ${vendors.length} restaurateurs [1 par restaurant], ${delivererUsers.length} livreurs)\n` +
        `  • Restaurants : ${restaurants.length} (enseignes réelles de Libreville/Akanda/Owendo, avec menus et plats réels)\n` +
        `\nMot de passe en clair pour TOUS les comptes de démo : ${CLEAR_PASSWORD}\n` +
        `   (haché automatiquement à l'insertion par User.pre('save') — la connexion via /api/auth/login fonctionne normalement)\n` +
        `\n   Exemples de connexion :\n` +
        `  • Client      : customer1@librevilleeats.ga / ${CLEAR_PASSWORD}\n` +
        `  • Restaurateur : ${vendors[0].email} / ${CLEAR_PASSWORD}\n` +
        `  • Livreur     : ${delivererUsers[0].email} / ${CLEAR_PASSWORD}\n` +
        `  (les ${vendors.length} comptes restaurateurs sont vendor-<nom-du-restaurant>@librevilleeats.ga ; les ${delivererUsers.length} comptes livreurs sont <prenomnom>@librevilleeats.ga)\n`
    );

    await mongoose.disconnect();
    logger.info('Déconnecté de MongoDB');
  } catch (err) {
    logger.error('Échec du peuplement', {
      message: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
}

// Nous lançons le peuplement
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedUsers, seedRestaurants, seedDeliverers };
