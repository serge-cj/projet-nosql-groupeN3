// scripts/01-crud.js
// Opérations CRUD de base — insertOne / insertMany / find / updateOne / updateMany / deleteOne
// Script mongosh autonome. Usage :
//   load("data/seed.js")
//   load("scripts/01-crud.js")

print('\n=== 01-crud.js ===\n');

// ---------- insertOne ----------
print('--- insertOne : nouveau restaurant ---');
const newRestaurant = db.restaurants.insertOne({
  name: 'Akébé Délices',
  email: 'contact@akebedelices.ga',
  phone: '+24106666666',
  address: {
    street: 'Rue de l\'Akébé',
    district: 'Akébé',
    city: 'Libreville',
    coordinates: { type: 'Point', coordinates: [9.4650, 0.4220] },
  },
  isOpen: true,
  rating: 0,
  reviewCount: 0,
  menus: [
    {
      name: 'Menu Découverte',
      dishes: [
        { name: 'Nyembwe de Poisson', price: 4200, category: 'Plats Principaux', isAvailable: true, quantity: 20 },
      ],
    },
  ],
  deliveryZones: [{ zone: 'Akébé', deliveryFee: 1000, deliveryTime: 25 }],
  metadata: { createdAt: new Date(), updatedAt: new Date(), totalOrders: 0, totalRevenue: 0 },
});
printjson(newRestaurant);
const akebeId = newRestaurant.insertedId;

// ---------- insertMany ----------
print('\n--- insertMany : nouveaux clients ---');
const newUsers = db.users.insertMany([
  {
    email: 'paul.ogandaga@gmail.com',
    password: '$2b$10$hashFactice6',
    role: 'CUSTOMER',
    profile: { firstName: 'Paul', lastName: 'Ogandaga', phone: '+24106777777' },
    addresses: [],
    isActive: true,
    metadata: { createdAt: new Date(), updatedAt: new Date() },
  },
  {
    email: 'sylvie.koumba@gmail.com',
    password: '$2b$10$hashFactice7',
    role: 'CUSTOMER',
    profile: { firstName: 'Sylvie', lastName: 'Koumba', phone: '+24106888888' },
    addresses: [],
    isActive: true,
    metadata: { createdAt: new Date(), updatedAt: new Date() },
  },
]);
printjson(newUsers);

// ---------- find ----------
print('\n--- find : restaurants ouverts ---');
db.restaurants.find({ isOpen: true }, { name: 1, 'address.district': 1, rating: 1 }).forEach(printjson);

print('\n--- find : un client par email ---');
printjson(db.users.findOne({ email: 'paul.ogandaga@gmail.com' }));

// ---------- updateOne ----------
print('\n--- updateOne : fermer un restaurant ---');
const updateOneResult = db.restaurants.updateOne(
  { _id: akebeId },
  { $set: { isOpen: false, 'metadata.updatedAt': new Date() } },
);
printjson(updateOneResult);

// ---------- updateMany ----------
print('\n--- updateMany : vérifier les emails des nouveaux clients ---');
const updateManyResult = db.users.updateMany(
  { role: 'CUSTOMER', emailVerified: { $exists: false } },
  { $set: { emailVerified: false } },
);
printjson(updateManyResult);

// ---------- deleteOne ----------
print('\n--- deleteOne : supprimer le restaurant de démonstration ---');
const deleteResult = db.restaurants.deleteOne({ _id: akebeId });
printjson(deleteResult);

print('\n=== Fin 01-crud.js ===\n');
