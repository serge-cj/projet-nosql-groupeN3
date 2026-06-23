// Libreville Districts & Neighborhoods
const DISTRICTS = {
  NOMBREKELE: 'Nombakélé',
  BATAEVA: 'Batavéa',
  DEIDATE: 'Deïdate',
  GUE_GUE: 'Gué-Gué',
  OKALA: 'Okala',
  NKEMBO: 'Nkembo',
  AKEBE: 'Akébé',
  LALALA: 'Lalala',
  PK5: 'PK5',
  SANTA_MARIJA: 'Santa-Marija',
};

// Gabon-specific dishes
const GABON_DISHES = [
  {
    name: 'Poulet Nyembwe',
    description: 'Poulet sauce cacahuète épicée avec riz blanc',
    category: 'Plats Principaux',
    price: 3500,
    preparationTime: 20,
  },
  {
    name: 'Attiéké',
    description: 'Couscous de manioc savoureux',
    category: 'Accompagnements',
    price: 1500,
    preparationTime: 5,
  },
  {
    name: 'Libuma Okondé',
    description: 'Poisson fumé sauce gombo avec banane plantain',
    category: 'Plats Principaux',
    price: 4200,
    preparationTime: 25,
  },
  {
    name: 'Bâton de Manioc',
    description: 'Bâton de manioc frit croustillant',
    category: 'Accompagnements',
    price: 1200,
    preparationTime: 8,
  },
  {
    name: 'Viande Grillée',
    description: 'Brochette de viande grillée épicée',
    category: 'Plats Principaux',
    price: 3800,
    preparationTime: 22,
  },
  {
    name: 'Banane Plantain Frite',
    description: 'Banane plantain bien frite et salée',
    category: 'Accompagnements',
    price: 1000,
    preparationTime: 10,
  },
  {
    name: 'Soupe Okra',
    description: 'Soupe gombo riche avec viande et poisson',
    category: 'Plats Principaux',
    price: 3200,
    preparationTime: 18,
  },
  {
    name: 'Riz à la Sauce Tomate',
    description: 'Riz blanc avec sauce tomate maison',
    category: 'Accompagnements',
    price: 1300,
    preparationTime: 12,
  },
  {
    name: 'Piment Aioli',
    description: 'Mayonnaise épicée maison',
    category: 'Accompagnements',
    price: 500,
    preparationTime: 2,
  },
  {
    name: 'Jus de Goyave',
    description: 'Jus de goyave frais 50cl',
    category: 'Boissons',
    price: 1500,
    preparationTime: 1,
  },
  {
    name: 'Bissap',
    description: 'Boisson hibiscus froide traditionnelle',
    category: 'Boissons',
    price: 1200,
    preparationTime: 1,
  },
  {
    name: 'Flan Gabon',
    description: 'Crème caramel à la gabonaibe',
    category: 'Desserts',
    price: 2000,
    preparationTime: 5,
  },
];

// Gabon phone numbers (+241)
const PHONE_GENERATORS = {
  generatePhone: () => {
    const operators = ['06', '07']; // Gabon operators
    const operator = operators[Math.floor(Math.random() * operators.length)];
    const rest = Math.floor(Math.random() * 100000000)
      .toString()
      .padStart(8, '0');
    return `+241${operator}${rest.slice(0, 6)}`;
  },
};

// Restaurant names (Gabon-local)
const RESTAURANT_NAMES = [
  'Chez Albert - Libreville',
  'Le Petit Gabon',
  'Restaurant Akébé',
  'Saveurs de Libreville',
  'Okala Express',
  'Table Gabonaibe',
  'Le Coin du Repas',
  'Taste of Gabon',
  'Resto Nyembwe',
  'La Maison du Poulet',
];

// Delivery zones with fees (in FCFA)
const DELIVERY_ZONES = [
  { zone: 'Nombakélé', deliveryFee: 1000, deliveryTime: 25 },
  { zone: 'Batavéa', deliveryFee: 1500, deliveryTime: 35 },
  { zone: 'Deïdate', deliveryFee: 2000, deliveryTime: 40 },
  { zone: 'Gué-Gué', deliveryFee: 1800, deliveryTime: 38 },
  { zone: 'Okala', deliveryFee: 2500, deliveryTime: 45 },
  { zone: 'Nkembo', deliveryFee: 1200, deliveryTime: 28 },
  { zone: 'Akébé', deliveryFee: 1600, deliveryTime: 32 },
  { zone: 'Lalala', deliveryFee: 2200, deliveryTime: 42 },
  { zone: 'PK5', deliveryFee: 3000, deliveryTime: 50 },
  { zone: 'Santa-Marija', deliveryFee: 1400, deliveryTime: 30 },
];

// Operating hours (typical for Gabon)
const OPERATING_HOURS = {
  monday: { open: '11:00', close: '23:00' },
  tuesday: { open: '11:00', close: '23:00' },
  wednesday: { open: '11:00', close: '23:00' },
  thursday: { open: '11:00', close: '23:00' },
  friday: { open: '11:00', close: '00:30' },
  saturday: { open: '10:00', close: '01:00' },
  sunday: { open: '10:00', close: '23:00' },
};

// Libreville coordinates (approximate by district)
const DISTRICT_COORDINATES = {
  'Nombakélé': [9.4583, 0.4162],
  'Batavéa': [9.4640, 0.4200],
  'Deïdate': [9.4720, 0.4280],
  'Gué-Gué': [9.4750, 0.4150],
  'Okala': [9.4500, 0.4050],
  'Nkembo': [9.4450, 0.4300],
  'Akébé': [9.4900, 0.4100],
  'Lalala': [9.4600, 0.4350],
  'PK5': [9.4300, 0.4200],
  'Santa-Marija': [9.4550, 0.4050],
};

// First names (Gabon-local)
const FIRST_NAMES = [
  'Ahmed',
  'Jean',
  'Marie',
  'Pierre',
  'Josiane',
  'Alphonse',
  'Sylvie',
  'Rodrigue',
  'Yvette',
  'Laurent',
  'Carole',
  'Bernard',
  'Nicole',
  'Dominique',
  'Chantal',
  'Samuel',
  'Beatrice',
  'Michel',
  'Isabelle',
  'Pascal',
];

// Last names (Gabon-local)
const LAST_NAMES = [
  'Makanda',
  'N\'Sabi',
  'Bongo',
  'Mba',
  'Nguema',
  'Fang',
  'Angoué',
  'Akendengué',
  'Oyono',
  'Ndoumou',
  'Kouma',
  'Kombila',
  'Bemba',
  'Meye',
  'Awoume',
  'Ngadi',
  'Tonda',
  'Keming',
  'Ondo',
  'Sanda',
];

module.exports = {
  DISTRICTS,
  GABON_DISHES,
  PHONE_GENERATORS,
  RESTAURANT_NAMES,
  DELIVERY_ZONES,
  OPERATING_HOURS,
  DISTRICT_COORDINATES,
  FIRST_NAMES,
  LAST_NAMES,
};
