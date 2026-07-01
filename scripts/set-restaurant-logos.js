// Met à jour uniquement le champ `image` des restaurants déjà présents en base
// (sans toucher aux autres documents), pour les bases déjà seedées avant l'ajout
// des logos dans scripts/data/gabon-data.js. Se base directement sur REAL_RESTAURANTS
// pour rester en phase avec les données de seed (un seul endroit à maintenir).
//
// Usage :
//   MONGODB_URI="mongodb://localhost:27017/projet-nosql-groupen3" node scripts/set-restaurant-logos.js
//   MONGODB_URI="mongodb+srv://..." node scripts/set-restaurant-logos.js

const mongoose = require('mongoose');
require('dotenv').config();

const { Restaurant } = require('../src/models');
const { REAL_RESTAURANTS } = require('./data/gabon-data');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI manquant');
  }

  await mongoose.connect(uri);

  for (const r of REAL_RESTAURANTS) {
    if (!r.image) continue;
    const result = await Restaurant.updateMany(
      { name: r.name },
      { $set: { image: r.image } }
    );
    console.log(
      `${r.name}: ${result.matchedCount} trouvé(s), ${result.modifiedCount} mis à jour avec ${r.image}`
    );
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
