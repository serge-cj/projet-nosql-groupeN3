// scripts/01-crud.js
// Nous illustrons ici les opérations CRUD de base — insertOne / insertMany / find / updateOne / updateMany /
// deleteOne / deleteMany, ainsi que les opérateurs $set, $inc, $push, $pull.
// Nous exécutons ce script de manière autonome avec mongosh. Usage :
//   load("data/seed.js")
//   load("scripts/01-crud.js")

print('\n=== 01-crud.js ===\n');

// ---------- insertOne : nous insérons un nouveau restaurant ----------
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

// ---------- insertMany : nous insérons plusieurs clients en une seule opération ----------
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

// ---------- find : nous interrogeons les collections ----------
print('\n--- find : restaurants ouverts ---');
db.restaurants.find({ isOpen: true }, { name: 1, 'address.district': 1, rating: 1 }).forEach(printjson);

print('\n--- find : un client par email ---');
printjson(db.users.findOne({ email: 'paul.ogandaga@gmail.com' }));

// ---------- updateOne : nous mettons à jour un seul document ----------
print('\n--- updateOne : fermer un restaurant ---');
const updateOneResult = db.restaurants.updateOne(
  { _id: akebeId },
  { $set: { isOpen: false, 'metadata.updatedAt': new Date() } },
);
printjson(updateOneResult);

// ---------- updateMany : nous mettons à jour plusieurs documents à la fois ----------
print('\n--- updateMany : vérifier les emails des nouveaux clients ---');
const updateManyResult = db.users.updateMany(
  { role: 'CUSTOMER', emailVerified: { $exists: false } },
  { $set: { emailVerified: false } },
);
printjson(updateManyResult);

// ---------- $inc : nous incrémentons des compteurs numériques ----------
print('\n--- $inc : incrémenter le compteur de commandes et le CA du restaurant ---');
const incResult = db.restaurants.updateOne(
  { _id: akebeId },
  { $inc: { 'metadata.totalOrders': 1, 'metadata.totalRevenue': 4200 } },
);
printjson(incResult);

// ---------- $push : nous ajoutons un élément à un tableau ----------
print('\n--- $push : ajouter une transition de statut dans statusHistory ---');
const someOrder = db.commandes.findOne({});
if (someOrder) {
  const pushResult = db.commandes.updateOne(
    { _id: someOrder._id },
    { $push: { statusHistory: { status: someOrder.status, timestamp: new Date(), note: 'Vérification manuelle' } } },
  );
  printjson(pushResult);
}

// ---------- $pull : nous retirons un élément d'un tableau ----------
print('\n--- $pull : retirer un restaurant des favoris d\'un client ---');
const someUser = db.users.findOne({ role: 'CUSTOMER' });
if (someUser) {
  const pullResult = db.users.updateOne(
    { _id: someUser._id },
    { $pull: { favoriteRestaurants: akebeId } },
  );
  printjson(pullResult);
}

// ---------- deleteOne : nous supprimons un seul document ----------
print('\n--- deleteOne : supprimer le restaurant de démonstration ---');
const deleteResult = db.restaurants.deleteOne({ _id: akebeId });
printjson(deleteResult);

// ---------- deleteMany : nous supprimons plusieurs documents à la fois ----------
print('\n--- deleteMany : purger les clients de démonstration insérés plus haut ---');
const deleteManyResult = db.users.deleteMany({
  email: { $in: ['paul.ogandaga@gmail.com', 'sylvie.koumba@gmail.com'] },
});
printjson(deleteManyResult);

print('\n=== Fin 01-crud.js ===\n');
