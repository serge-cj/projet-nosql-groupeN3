// data/seed.js
// Nous fournissons ici des données de test réalistes (30 vraies enseignes de Libreville/Akanda/Owendo,
// 30 clients, 30 restaurateurs, 30 livreurs — tous avec des noms gabonais)
// pour le projet Libreville Eats.
// Nous exécutons ce script de manière autonome avec mongosh — aucune dépendance Node.js / Mongoose.
//
// Usage :
//   mongosh "mongodb://localhost:27017/libreville_eats"
//   load("data/seed.js")
//
// Référence : nous transcrivons ici en mongosh pur le jeu de
// données réel utilisé par l'application (scripts/data/gabon-data.js ->
// REAL_RESTAURANTS, inséré via scripts/seed/index.js / npm run seed).
//
// Nous laissons le mot de passe en clair pour TOUS les comptes (clients, restaurateurs,
// livreurs) : TestPass123 — volontairement non haché ici (insertMany mongosh pur,
// pas de hook de hachage bcrypt) afin de pouvoir présenter et identifier
// facilement les comptes. Pour nous connecter via l'application réelle
// (qui exige un hash bcrypt), nous utilisons plutôt "npm run seed".

const CLEAR_PASSWORD = 'TestPass123';

db.users.drop();
db.restaurants.drop();
db.deliverers.drop();
db.commandes.drop();

// ============ Nous définissons ici les données de référence (contexte gabonais) ============
const FIRST_NAMES = ["Ahmed","Jean","Marie","Pierre","Josiane","Alphonse","Sylvie","Rodrigue","Yvette","Laurent","Carole","Bernard","Nicole","Dominique","Chantal","Samuel","Beatrice","Michel","Isabelle","Pascal"];
const LAST_NAMES = ["Makanda","N'Sabi","Bongo","Mba","Nguema","Fang","Angoué","Akendengué","Oyono","Ndoumou","Kouma","Kombila","Bemba","Meye","Awoume","Ngadi","Tonda","Keming","Ondo","Sanda"];
const DISTRICTS = ["Nombakélé","Batavéa","Deïdate","Gué-Gué","Okala","Nkembo","Akébé","Lalala","PK5","Santa-Marija","Nzeng Ayong","Owendo","Akanda","3 Quartiers","Glass","Baie des Rois","Batterie IV","Carrefour JDO","Centre-ville","Aéroport","Montagne Sainte","Louis"];
const DISTRICT_COORDINATES = {
  "Nombakélé": [
    9.4583,
    0.4162
  ],
  "Batavéa": [
    9.464,
    0.42
  ],
  "Deïdate": [
    9.472,
    0.428
  ],
  "Gué-Gué": [
    9.475,
    0.415
  ],
  "Okala": [
    9.45,
    0.405
  ],
  "Nkembo": [
    9.445,
    0.43
  ],
  "Akébé": [
    9.49,
    0.41
  ],
  "Lalala": [
    9.46,
    0.435
  ],
  "PK5": [
    9.43,
    0.42
  ],
  "Santa-Marija": [
    9.455,
    0.405
  ],
  "Nzeng Ayong": [
    9.505,
    0.455
  ],
  "Owendo": [
    9.51,
    0.355
  ],
  "Akanda": [
    9.445,
    0.52
  ],
  "3 Quartiers": [
    9.438,
    0.392
  ],
  "Glass": [
    9.447,
    0.398
  ],
  "Baie des Rois": [
    9.454,
    0.387
  ],
  "Batterie IV": [
    9.462,
    0.448
  ],
  "Carrefour JDO": [
    9.47,
    0.44
  ],
  "Centre-ville": [
    9.449,
    0.392
  ],
  "Aéroport": [
    9.412,
    0.458
  ],
  "Montagne Sainte": [
    9.435,
    0.415
  ],
  "Louis": [
    9.44,
    0.45
  ]
};

const gabonName = (index) => ({
  firstName: FIRST_NAMES[index % FIRST_NAMES.length],
  lastName: LAST_NAMES[(index * 7 + 3) % LAST_NAMES.length],
});

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

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

// Nous listons ici 30 vraies enseignes de Libreville/Akanda/Owendo, avec leurs menus réels
// (même contenu que scripts/data/gabon-data.js -> REAL_RESTAURANTS).
const REAL_RESTAURANTS = [
  {
    "name": "KFC - Nzeng Ayong",
    "street": "CFF9+PW, Nzeng Ayong, Libreville, Gabon",
    "district": "Nzeng Ayong",
    "coordinates": [
      9.505,
      0.455
    ],
    "phone": "+24111448888",
    "email": "contact@kfc.ga",
    "hoursText": "Ouvert tous les jours de 10h00 à 23h00",
    "hours": {
      "monday": {
        "open": "10:00",
        "close": "23:00"
      },
      "tuesday": {
        "open": "10:00",
        "close": "23:00"
      },
      "wednesday": {
        "open": "10:00",
        "close": "23:00"
      },
      "thursday": {
        "open": "10:00",
        "close": "23:00"
      },
      "friday": {
        "open": "10:00",
        "close": "23:00"
      },
      "saturday": {
        "open": "10:00",
        "close": "23:00"
      },
      "sunday": {
        "open": "10:00",
        "close": "23:00"
      }
    },
    "dishes": [
      {
        "name": "Bucket de 8 ou 15 morceaux de poulet",
        "category": "Plats Principaux",
        "price": 6151
      },
      {
        "name": "Zinger Burger",
        "category": "Plats Principaux",
        "price": 4270
      },
      {
        "name": "Colonel Burger",
        "category": "Plats Principaux",
        "price": 4363
      },
      {
        "name": "Twister Wrap",
        "category": "Plats Principaux",
        "price": 4196
      },
      {
        "name": "Frites classiques",
        "category": "Accompagnements",
        "price": 1337
      },
      {
        "name": "Poulet Popcorn",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Hot Wings (ailes épicées)",
        "category": "Accompagnements",
        "price": 918
      },
      {
        "name": "Tenders de poulet",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Salade Coleslaw",
        "category": "Entrées",
        "price": 1043
      },
      {
        "name": "Sundae au chocolat",
        "category": "Desserts",
        "price": 2731
      }
    ]
  },
  {
    "name": "KFC - Owendo",
    "street": "8FQH+V8, Owendo, Gabon",
    "district": "Owendo",
    "coordinates": [
      9.51,
      0.355
    ],
    "phone": "+24111448888",
    "email": "contact@kfc.ga",
    "hoursText": "Ouvert tous les jours de 10h00 à 23h00",
    "hours": {
      "monday": {
        "open": "10:00",
        "close": "23:00"
      },
      "tuesday": {
        "open": "10:00",
        "close": "23:00"
      },
      "wednesday": {
        "open": "10:00",
        "close": "23:00"
      },
      "thursday": {
        "open": "10:00",
        "close": "23:00"
      },
      "friday": {
        "open": "10:00",
        "close": "23:00"
      },
      "saturday": {
        "open": "10:00",
        "close": "23:00"
      },
      "sunday": {
        "open": "10:00",
        "close": "23:00"
      }
    },
    "dishes": [
      {
        "name": "Bucket Familial (morceaux + frites + boisson)",
        "category": "Accompagnements",
        "price": 12050
      },
      {
        "name": "Boxmaster",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Menu Krushem",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Riz épicé façon KFC",
        "category": "Accompagnements",
        "price": 1649
      },
      {
        "name": "Filet de poulet grillé",
        "category": "Plats Principaux",
        "price": 5233
      },
      {
        "name": "Beignets de poulet croustillants",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Long Burger Poulet",
        "category": "Plats Principaux",
        "price": 4712
      },
      {
        "name": "Nuggets de poulet",
        "category": "Accompagnements",
        "price": 1262
      },
      {
        "name": "Tarte aux pommes chaude",
        "category": "Desserts",
        "price": 1216
      },
      {
        "name": "Salade verte d'accompagnement",
        "category": "Entrées",
        "price": 1211
      }
    ]
  },
  {
    "name": "KFC - Avorbam (Secteur Okala)",
    "street": "F9XV+CF7, Route d'Okala (Axe Avorbam), Libreville, Gabon",
    "district": "Okala",
    "coordinates": [
      9.45,
      0.405
    ],
    "phone": "+24111448888",
    "email": "contact@kfc.ga",
    "hoursText": "Ouvert tous les jours de 10h00 à 23h00",
    "hours": {
      "monday": {
        "open": "10:00",
        "close": "23:00"
      },
      "tuesday": {
        "open": "10:00",
        "close": "23:00"
      },
      "wednesday": {
        "open": "10:00",
        "close": "23:00"
      },
      "thursday": {
        "open": "10:00",
        "close": "23:00"
      },
      "friday": {
        "open": "10:00",
        "close": "23:00"
      },
      "saturday": {
        "open": "10:00",
        "close": "23:00"
      },
      "sunday": {
        "open": "10:00",
        "close": "23:00"
      }
    },
    "dishes": [
      {
        "name": "Bucket de 12 Tenders croustillants",
        "category": "Plats Principaux",
        "price": 6190
      },
      {
        "name": "Double Zinger Burger",
        "category": "Plats Principaux",
        "price": 4905
      },
      {
        "name": "Cheese Burger Poulet",
        "category": "Plats Principaux",
        "price": 4901
      },
      {
        "name": "Wrap BBQ Poulet",
        "category": "Plats Principaux",
        "price": 4320
      },
      {
        "name": "Frites grand format",
        "category": "Accompagnements",
        "price": 1457
      },
      {
        "name": "Mini-bucket pour enfants",
        "category": "Plats Principaux",
        "price": 5349
      },
      {
        "name": "Sauce secrète du Colonel",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Cobette de maïs chaud",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Muffin au chocolat",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Milkshake vanille",
        "category": "Boissons",
        "price": 1199
      }
    ]
  },
  {
    "name": "Blé Doré - Avorbam",
    "street": "F9XV+M54, Route d'Avorbam, Akanda, Gabon",
    "district": "Akanda",
    "coordinates": [
      9.445,
      0.52
    ],
    "phone": "+24177222216",
    "email": "service.client@bledore.ga",
    "hoursText": "Ouvert tous les jours de 06h00 à 20h30",
    "hours": {
      "monday": {
        "open": "06:00",
        "close": "20:30"
      },
      "tuesday": {
        "open": "06:00",
        "close": "20:30"
      },
      "wednesday": {
        "open": "06:00",
        "close": "20:30"
      },
      "thursday": {
        "open": "06:00",
        "close": "20:30"
      },
      "friday": {
        "open": "06:00",
        "close": "20:30"
      },
      "saturday": {
        "open": "06:00",
        "close": "20:30"
      },
      "sunday": {
        "open": "06:00",
        "close": "20:30"
      }
    },
    "dishes": [
      {
        "name": "Baguette de pain traditionnelle",
        "category": "Desserts",
        "price": 2039
      },
      {
        "name": "Croissant pur beurre",
        "category": "Desserts",
        "price": 1001
      },
      {
        "name": "Pain au chocolat",
        "category": "Desserts",
        "price": 2515
      },
      {
        "name": "Chausson aux pommes",
        "category": "Desserts",
        "price": 2500
      },
      {
        "name": "Éclair au chocolat",
        "category": "Desserts",
        "price": 2847
      },
      {
        "name": "Sandwich complet au poulet crudités",
        "category": "Plats Principaux",
        "price": 3078
      },
      {
        "name": "Pizza à la coupe",
        "category": "Plats Principaux",
        "price": 4591
      },
      {
        "name": "Quiche lorraine",
        "category": "Plats Principaux",
        "price": 4499
      },
      {
        "name": "Tartelette aux fruits tropicaux (mangue/passion)",
        "category": "Desserts",
        "price": 1704
      },
      {
        "name": "Jus de bissap frais",
        "category": "Boissons",
        "price": 1277
      }
    ]
  },
  {
    "name": "Blé Doré - Owendo",
    "street": "8FMM+XQH, Boulevard de l'Indépendance, Owendo, Gabon",
    "district": "Owendo",
    "coordinates": [
      9.51,
      0.355
    ],
    "phone": "+24177222216",
    "email": "service.client@bledore.ga",
    "hoursText": "Ouvert tous les jours de 06h00 à 20h30",
    "hours": {
      "monday": {
        "open": "06:00",
        "close": "20:30"
      },
      "tuesday": {
        "open": "06:00",
        "close": "20:30"
      },
      "wednesday": {
        "open": "06:00",
        "close": "20:30"
      },
      "thursday": {
        "open": "06:00",
        "close": "20:30"
      },
      "friday": {
        "open": "06:00",
        "close": "20:30"
      },
      "saturday": {
        "open": "06:00",
        "close": "20:30"
      },
      "sunday": {
        "open": "06:00",
        "close": "20:30"
      }
    },
    "dishes": [
      {
        "name": "Pain complet",
        "category": "Desserts",
        "price": 2180
      },
      {
        "name": "Brioche tressée au sucre",
        "category": "Desserts",
        "price": 1450
      },
      {
        "name": "Pain aux raisins",
        "category": "Desserts",
        "price": 2551
      },
      {
        "name": "Mille-feuille traditionnel",
        "category": "Desserts",
        "price": 1610
      },
      {
        "name": "Tarte au citron meringuée",
        "category": "Desserts",
        "price": 1569
      },
      {
        "name": "Gâteau opéra",
        "category": "Desserts",
        "price": 2427
      },
      {
        "name": "Sandwich thon mayonnaise",
        "category": "Plats Principaux",
        "price": 5398
      },
      {
        "name": "Panini chaud fromage-jambon",
        "category": "Plats Principaux",
        "price": 5601
      },
      {
        "name": "Salade fraîcheur à emporter",
        "category": "Entrées",
        "price": 1268
      },
      {
        "name": "Café expresso",
        "category": "Boissons",
        "price": 2420
      }
    ]
  },
  {
    "name": "Hama Burger n' co - Akanda",
    "street": "GC83+244 Parasoliers, Akanda, Gabon",
    "district": "Akanda",
    "coordinates": [
      9.445,
      0.52
    ],
    "phone": "+24176257777",
    "email": "contact@hamaburger.com",
    "hoursText": "Ouvert tous les jours de 09h00 à 00h00",
    "hours": {
      "monday": {
        "open": "09:00",
        "close": "00:00"
      },
      "tuesday": {
        "open": "09:00",
        "close": "00:00"
      },
      "wednesday": {
        "open": "09:00",
        "close": "00:00"
      },
      "thursday": {
        "open": "09:00",
        "close": "00:00"
      },
      "friday": {
        "open": "09:00",
        "close": "00:00"
      },
      "saturday": {
        "open": "09:00",
        "close": "00:00"
      },
      "sunday": {
        "open": "09:00",
        "close": "00:00"
      }
    },
    "dishes": [
      {
        "name": "Hama Burger Classic",
        "category": "Plats Principaux",
        "price": 4760
      },
      {
        "name": "Double Cheese Burger",
        "category": "Plats Principaux",
        "price": 4871
      },
      {
        "name": "Bacon Burger Deluxe",
        "category": "Plats Principaux",
        "price": 4777
      },
      {
        "name": "Crispy Chicken Burger (poulet pané)",
        "category": "Plats Principaux",
        "price": 6368
      },
      {
        "name": "Fish Burger",
        "category": "Plats Principaux",
        "price": 4041
      },
      {
        "name": "Frites de pommes de terre maison",
        "category": "Accompagnements",
        "price": 1431
      },
      {
        "name": "Onion Rings croustillants",
        "category": "Accompagnements",
        "price": 923
      },
      {
        "name": "Hot Dog américain grillé",
        "category": "Plats Principaux",
        "price": 5517
      },
      {
        "name": "Milkshake à la vanille",
        "category": "Boissons",
        "price": 1692
      },
      {
        "name": "Fondant au chocolat",
        "category": "Desserts",
        "price": 2837
      }
    ]
  },
  {
    "name": "Hama Burger n' co - 3 Quartiers",
    "street": "3 Quartiers, Libreville, Gabon",
    "district": "3 Quartiers",
    "coordinates": [
      9.438,
      0.392
    ],
    "phone": "+24162147777",
    "email": "contact@hamaburger.com",
    "hoursText": "Ouvert tous les jours de 09h00 à 00h00",
    "hours": {
      "monday": {
        "open": "09:00",
        "close": "00:00"
      },
      "tuesday": {
        "open": "09:00",
        "close": "00:00"
      },
      "wednesday": {
        "open": "09:00",
        "close": "00:00"
      },
      "thursday": {
        "open": "09:00",
        "close": "00:00"
      },
      "friday": {
        "open": "09:00",
        "close": "00:00"
      },
      "saturday": {
        "open": "09:00",
        "close": "00:00"
      },
      "sunday": {
        "open": "09:00",
        "close": "00:00"
      }
    },
    "dishes": [
      {
        "name": "Hama BBQ Special",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Burger Avocat-Bacon",
        "category": "Plats Principaux",
        "price": 4781
      },
      {
        "name": "Spicy Chili Burger (au piment local)",
        "category": "Plats Principaux",
        "price": 6255
      },
      {
        "name": "Veggie Burger",
        "category": "Plats Principaux",
        "price": 4246
      },
      {
        "name": "Frites de patates douces",
        "category": "Accompagnements",
        "price": 1914
      },
      {
        "name": "Nuggets de poulet",
        "category": "Accompagnements",
        "price": 1262
      },
      {
        "name": "Salade César au poulet grillé",
        "category": "Entrées",
        "price": 1388
      },
      {
        "name": "Wrap poulet Tex-Mex",
        "category": "Plats Principaux",
        "price": 4787
      },
      {
        "name": "Sundae nappage caramel",
        "category": "Desserts",
        "price": 1128
      },
      {
        "name": "Cocktail Mojito sans alcool",
        "category": "Boissons",
        "price": 2102
      }
    ]
  },
  {
    "name": "Morelli's Gelato - Baie Des Rois",
    "street": "CC3J+P6, Promenade de la Baie des Rois, Libreville, Gabon",
    "district": "Baie des Rois",
    "coordinates": [
      9.454,
      0.387
    ],
    "phone": "+24174123456",
    "email": "info@morellisgelato.ga",
    "hoursText": "Ouvert tous les jours de 11h00 à 23h00",
    "hours": {
      "monday": {
        "open": "11:00",
        "close": "23:00"
      },
      "tuesday": {
        "open": "11:00",
        "close": "23:00"
      },
      "wednesday": {
        "open": "11:00",
        "close": "23:00"
      },
      "thursday": {
        "open": "11:00",
        "close": "23:00"
      },
      "friday": {
        "open": "11:00",
        "close": "23:00"
      },
      "saturday": {
        "open": "11:00",
        "close": "23:00"
      },
      "sunday": {
        "open": "11:00",
        "close": "23:00"
      }
    },
    "dishes": [
      {
        "name": "Gelato Vanille de Madagascar",
        "category": "Desserts",
        "price": 1611
      },
      {
        "name": "Gelato Chocolat Noir",
        "category": "Desserts",
        "price": 2889
      },
      {
        "name": "Sorbet à la Mangue locale",
        "category": "Desserts",
        "price": 1408
      },
      {
        "name": "Gelato Caramel au beurre salé",
        "category": "Desserts",
        "price": 1836
      },
      {
        "name": "Coupe Morelli's Special",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Gaufre chaude au chocolat",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Crêpe Banane-Nutella",
        "category": "Plats Principaux",
        "price": 1610
      },
      {
        "name": "Milkshake au choix",
        "category": "Boissons",
        "price": 1237
      },
      {
        "name": "Café Affogato",
        "category": "Boissons",
        "price": 2338
      },
      {
        "name": "Coupe de fruits de saison et son sorbet exotique",
        "category": "Desserts",
        "price": 1578
      }
    ]
  },
  {
    "name": "Morelli's Gelato - Classico Club",
    "street": "Complexe Classico Club, Libreville, Gabon",
    "district": "Glass",
    "coordinates": [
      9.447,
      0.398
    ],
    "phone": "+24174123457",
    "email": "info@morellisgelato.ga",
    "hoursText": "Ouvert tous les jours de 12h00 à 00h00",
    "hours": {
      "monday": {
        "open": "12:00",
        "close": "00:00"
      },
      "tuesday": {
        "open": "12:00",
        "close": "00:00"
      },
      "wednesday": {
        "open": "12:00",
        "close": "00:00"
      },
      "thursday": {
        "open": "12:00",
        "close": "00:00"
      },
      "friday": {
        "open": "12:00",
        "close": "00:00"
      },
      "saturday": {
        "open": "12:00",
        "close": "00:00"
      },
      "sunday": {
        "open": "12:00",
        "close": "00:00"
      }
    },
    "dishes": [
      {
        "name": "Gelato Pistache de Sicile",
        "category": "Desserts",
        "price": 1318
      },
      {
        "name": "Sorbet Fruit de la Passion (Maracudja)",
        "category": "Desserts",
        "price": 2428
      },
      {
        "name": "Gelato Stracciatella",
        "category": "Desserts",
        "price": 2976
      },
      {
        "name": "Coupe Classico gourmande (mix de glaces et chantilly)",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Banana Split revisité",
        "category": "Desserts",
        "price": 1171
      },
      {
        "name": "Gâteau glacé festif",
        "category": "Desserts",
        "price": 1072
      },
      {
        "name": "Café glacé Frappé",
        "category": "Boissons",
        "price": 1440
      },
      {
        "name": "Macaron glacé signature",
        "category": "Desserts",
        "price": 1386
      },
      {
        "name": "Smoothie détox aux fruits rouges",
        "category": "Boissons",
        "price": 1310
      },
      {
        "name": "Cône de gaufrette artisanale fait maison",
        "category": "Desserts",
        "price": 2976
      }
    ]
  },
  {
    "name": "Pinkberry",
    "street": "L101, Zone commerciale (proche Boulevard Triomphal), Libreville, Gabon",
    "district": "Centre-ville",
    "coordinates": [
      9.449,
      0.392
    ],
    "phone": "+24111443333",
    "email": "contact@pinkberry.ga",
    "hoursText": "Ouvert tous les jours de 10h00 à 23h00",
    "hours": {
      "monday": {
        "open": "10:00",
        "close": "23:00"
      },
      "tuesday": {
        "open": "10:00",
        "close": "23:00"
      },
      "wednesday": {
        "open": "10:00",
        "close": "23:00"
      },
      "thursday": {
        "open": "10:00",
        "close": "23:00"
      },
      "friday": {
        "open": "10:00",
        "close": "23:00"
      },
      "saturday": {
        "open": "10:00",
        "close": "23:00"
      },
      "sunday": {
        "open": "10:00",
        "close": "23:00"
      }
    },
    "dishes": [
      {
        "name": "Frozen Yogurt parfum Original",
        "category": "Desserts",
        "price": 1845
      },
      {
        "name": "Frozen Yogurt Mangue tropicale",
        "category": "Desserts",
        "price": 1941
      },
      {
        "name": "Frozen Yogurt Grenade",
        "category": "Desserts",
        "price": 1035
      },
      {
        "name": "Frozen Yogurt Chocolat onctueux",
        "category": "Desserts",
        "price": 2077
      },
      {
        "name": "Topping éclats de biscuits Oreo",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Topping morceaux de mangue fraîche",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Topping fraises coupées",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Topping coulis de miel naturel du Gabon",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Smoothie Pinkberry signature",
        "category": "Boissons",
        "price": 2331
      },
      {
        "name": "Parfait Pinkberry (yaourt, granola et fruits frais)",
        "category": "Plats Principaux",
        "price": 2500
      }
    ]
  },
  {
    "name": "La Braise",
    "street": "Promenade de la Baie des Rois, BP 20320, Libreville, Gabon",
    "district": "Baie des Rois",
    "coordinates": [
      9.454,
      0.387
    ],
    "phone": "+24174738342",
    "email": "labraise.gabon@gmail.com",
    "hoursText": "Ouvert tous les jours de 12h30 à 22h30",
    "hours": {
      "monday": {
        "open": "12:30",
        "close": "22:30"
      },
      "tuesday": {
        "open": "12:30",
        "close": "22:30"
      },
      "wednesday": {
        "open": "12:30",
        "close": "22:30"
      },
      "thursday": {
        "open": "12:30",
        "close": "22:30"
      },
      "friday": {
        "open": "12:30",
        "close": "22:30"
      },
      "saturday": {
        "open": "12:30",
        "close": "22:30"
      },
      "sunday": {
        "open": "12:30",
        "close": "22:30"
      }
    },
    "dishes": [
      {
        "name": "Poulet braisé entier (mariné aux épices locales)",
        "category": "Plats Principaux",
        "price": 4420
      },
      {
        "name": "Coupé-coupé de bœuf au feu de bois",
        "category": "Plats Principaux",
        "price": 3069
      },
      {
        "name": "Poisson braisé (Capitaine ou Bar frais)",
        "category": "Plats Principaux",
        "price": 3197
      },
      {
        "name": "Brochettes de lotte locales",
        "category": "Plats Principaux",
        "price": 5631
      },
      {
        "name": "Côtelettes de porc grillées",
        "category": "Plats Principaux",
        "price": 5905
      },
      {
        "name": "Alloco (bananes plantains frites)",
        "category": "Accompagnements",
        "price": 1528
      },
      {
        "name": "Chikwangue (manioc vapeur)",
        "category": "Plats Principaux",
        "price": 863
      },
      {
        "name": "Portion de frites maison",
        "category": "Accompagnements",
        "price": 1943
      },
      {
        "name": "Salade composée africaine (avocat, tomates, oignons)",
        "category": "Entrées",
        "price": 1000
      },
      {
        "name": "Sauce piment maison très épicée",
        "category": "Plats Principaux",
        "price": 2500
      }
    ]
  },
  {
    "name": "L'Emir",
    "street": "Quartier Louis, Libreville, Gabon",
    "district": "Louis",
    "coordinates": [
      9.44,
      0.45
    ],
    "phone": "+24111724000",
    "email": "contact@lemir-libreville.com",
    "hoursText": "Ouvert tous les jours de 12h00 à 23h30",
    "hours": {
      "monday": {
        "open": "12:00",
        "close": "23:30"
      },
      "tuesday": {
        "open": "12:00",
        "close": "23:30"
      },
      "wednesday": {
        "open": "12:00",
        "close": "23:30"
      },
      "thursday": {
        "open": "12:00",
        "close": "23:30"
      },
      "friday": {
        "open": "12:00",
        "close": "23:30"
      },
      "saturday": {
        "open": "12:00",
        "close": "23:30"
      },
      "sunday": {
        "open": "12:00",
        "close": "23:30"
      }
    },
    "dishes": [
      {
        "name": "Chouawarma Bœuf",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Chouawarma Poulet",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Assiette de Houmous traditionnel",
        "category": "Entrées",
        "price": 2675
      },
      {
        "name": "Taboulé libanais frais",
        "category": "Entrées",
        "price": 4280
      },
      {
        "name": "Moutabal (Caviar d'aubergines)",
        "category": "Entrées",
        "price": 2263
      },
      {
        "name": "Falafels croustillants",
        "category": "Entrées",
        "price": 4261
      },
      {
        "name": "Chich Taouk (Brochettes de poulet marinées)",
        "category": "Plats Principaux",
        "price": 3628
      },
      {
        "name": "Kefta grillé au feu de bois",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Assortiment de Baklawas",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Plateau de grillades mixtes L'Émir",
        "category": "Plats Principaux",
        "price": 11306
      }
    ]
  },
  {
    "name": "La Voile Rouge",
    "street": "Boulevard de l'Indépendance, Front de mer, Libreville, Gabon",
    "district": "Centre-ville",
    "coordinates": [
      9.449,
      0.392
    ],
    "phone": "+24165894412",
    "email": "reservation@lavoilerouge-lbv.com",
    "hoursText": "Ouvert du mardi au dimanche de 12h00 à 15h00 et de 19h00 à 23h00",
    "hours": {
      "monday": null,
      "tuesday": {
        "open": "12:00",
        "close": "23:00"
      },
      "wednesday": {
        "open": "12:00",
        "close": "23:00"
      },
      "thursday": {
        "open": "12:00",
        "close": "23:00"
      },
      "friday": {
        "open": "12:00",
        "close": "23:00"
      },
      "saturday": {
        "open": "12:00",
        "close": "23:00"
      },
      "sunday": {
        "open": "12:00",
        "close": "23:00"
      }
    },
    "dishes": [
      {
        "name": "Tartare de thon rouge local",
        "category": "Entrées",
        "price": 2061
      },
      {
        "name": "Filet de Capitaine à la plancha",
        "category": "Plats Principaux",
        "price": 5927
      },
      {
        "name": "Langouste grillée au beurre d'ail",
        "category": "Plats Principaux",
        "price": 11254
      },
      {
        "name": "Entrecôte de bœuf Black Angus",
        "category": "Plats Principaux",
        "price": 11042
      },
      {
        "name": "Risotto aux Saint-Jacques",
        "category": "Plats Principaux",
        "price": 5426
      },
      {
        "name": "Pavé de bar de l'estuaire grillé",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Carpaccio de bœuf au parmesan",
        "category": "Entrées",
        "price": 2454
      },
      {
        "name": "Moelleux au chocolat cœur coulant",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Crème brûlée à la vanille bourbon",
        "category": "Desserts",
        "price": 2622
      },
      {
        "name": "Salade Voile Rouge aux fruits de mer",
        "category": "Entrées",
        "price": 1729
      }
    ]
  },
  {
    "name": "Mun",
    "street": "Quartier Sablière, Akanda, Gabon",
    "district": "Akanda",
    "coordinates": [
      9.445,
      0.52
    ],
    "phone": "+24177059999",
    "email": "info@mun-libreville.com",
    "hoursText": "Ouvert tous les jours de 12h00 à 15h00 et de 19h00 à 23h30",
    "hours": {
      "monday": {
        "open": "12:00",
        "close": "23:30"
      },
      "tuesday": {
        "open": "12:00",
        "close": "23:30"
      },
      "wednesday": {
        "open": "12:00",
        "close": "23:30"
      },
      "thursday": {
        "open": "12:00",
        "close": "23:30"
      },
      "friday": {
        "open": "12:00",
        "close": "23:30"
      },
      "saturday": {
        "open": "12:00",
        "close": "23:30"
      },
      "sunday": {
        "open": "12:00",
        "close": "23:30"
      }
    },
    "dishes": [
      {
        "name": "Assortiment de Sushis et Makis Premium",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Tempura de crevettes géantes",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Canard laqué pékinois",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Tataki de thon au sésame",
        "category": "Entrées",
        "price": 4360
      },
      {
        "name": "Nouilles sautées au bœuf (Wok)",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Dim Sum aux crevettes cuits à la vapeur",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Poulet au curry vert et lait de coco",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Soupe Miso traditionnelle",
        "category": "Entrées",
        "price": 4498
      },
      {
        "name": "Mochi glacé (parfums variés)",
        "category": "Desserts",
        "price": 1860
      },
      {
        "name": "Tartare de saumon à l'avocat",
        "category": "Entrées",
        "price": 2219
      }
    ]
  },
  {
    "name": "PAUL - Glass",
    "street": "Boulevard Maritime, Quartier Glass, Libreville, Gabon",
    "district": "Glass",
    "coordinates": [
      9.447,
      0.398
    ],
    "phone": "+24111745501",
    "email": "paul.glass@paul.ga",
    "hoursText": "Ouvert tous les jours de 06h30 à 21h00",
    "hours": {
      "monday": {
        "open": "06:30",
        "close": "21:00"
      },
      "tuesday": {
        "open": "06:30",
        "close": "21:00"
      },
      "wednesday": {
        "open": "06:30",
        "close": "21:00"
      },
      "thursday": {
        "open": "06:30",
        "close": "21:00"
      },
      "friday": {
        "open": "06:30",
        "close": "21:00"
      },
      "saturday": {
        "open": "06:30",
        "close": "21:00"
      },
      "sunday": {
        "open": "06:30",
        "close": "21:00"
      }
    },
    "dishes": [
      {
        "name": "Croissant pur beurre",
        "category": "Desserts",
        "price": 1001
      },
      {
        "name": "Pain au chocolat",
        "category": "Desserts",
        "price": 2515
      },
      {
        "name": "Sandwich Dieppois (thon, mayonnaise, salade)",
        "category": "Entrées",
        "price": 3577
      },
      {
        "name": "Salade César au poulet grillé",
        "category": "Entrées",
        "price": 1388
      },
      {
        "name": "Tartelette aux framboises",
        "category": "Desserts",
        "price": 1518
      },
      {
        "name": "Éclair au café",
        "category": "Boissons",
        "price": 2533
      },
      {
        "name": "Croque-Monsieur traditionnel",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Grand Café Crème",
        "category": "Boissons",
        "price": 1177
      },
      {
        "name": "Jus d'orange frais pressé",
        "category": "Boissons",
        "price": 1999
      },
      {
        "name": "Macaron géant au chocolat",
        "category": "Desserts",
        "price": 1518
      }
    ]
  },
  {
    "name": "PAUL - Carrefour",
    "street": "Rond-point du Carrefour Léon Mba, Libreville, Gabon",
    "district": "Centre-ville",
    "coordinates": [
      9.449,
      0.392
    ],
    "phone": "+24111745502",
    "email": "paul.carrefour@paul.ga",
    "hoursText": "Ouvert tous les jours de 06h30 à 21h00",
    "hours": {
      "monday": {
        "open": "06:30",
        "close": "21:00"
      },
      "tuesday": {
        "open": "06:30",
        "close": "21:00"
      },
      "wednesday": {
        "open": "06:30",
        "close": "21:00"
      },
      "thursday": {
        "open": "06:30",
        "close": "21:00"
      },
      "friday": {
        "open": "06:30",
        "close": "21:00"
      },
      "saturday": {
        "open": "06:30",
        "close": "21:00"
      },
      "sunday": {
        "open": "06:30",
        "close": "21:00"
      }
    },
    "dishes": [
      {
        "name": "Baguette Paul artisanale",
        "category": "Desserts",
        "price": 1342
      },
      {
        "name": "Pain aux raisins",
        "category": "Desserts",
        "price": 2551
      },
      {
        "name": "Sandwich Atlantique (saumon fumé, fromage frais)",
        "category": "Plats Principaux",
        "price": 4139
      },
      {
        "name": "Quiche traditionnelle aux poireaux",
        "category": "Plats Principaux",
        "price": 6416
      },
      {
        "name": "Flan normand",
        "category": "Desserts",
        "price": 2168
      },
      {
        "name": "Mille-feuille Paul",
        "category": "Desserts",
        "price": 2720
      },
      {
        "name": "Salade de pâtes méditerranéenne",
        "category": "Entrées",
        "price": 1805
      },
      {
        "name": "Chocolat chaud signature",
        "category": "Boissons",
        "price": 1871
      },
      {
        "name": "Thé glacé maison",
        "category": "Boissons",
        "price": 1271
      },
      {
        "name": "Brioche moelleuse au sucre",
        "category": "Desserts",
        "price": 1526
      }
    ]
  },
  {
    "name": "PAUL - 3 Quartiers",
    "street": "Avenue de l'Indépendance, 3 Quartiers, Libreville, Gabon",
    "district": "3 Quartiers",
    "coordinates": [
      9.438,
      0.392
    ],
    "phone": "+24111745503",
    "email": "paul.3quartiers@paul.ga",
    "hoursText": "Ouvert tous les jours de 06h30 à 22h00",
    "hours": {
      "monday": {
        "open": "06:30",
        "close": "22:00"
      },
      "tuesday": {
        "open": "06:30",
        "close": "22:00"
      },
      "wednesday": {
        "open": "06:30",
        "close": "22:00"
      },
      "thursday": {
        "open": "06:30",
        "close": "22:00"
      },
      "friday": {
        "open": "06:30",
        "close": "22:00"
      },
      "saturday": {
        "open": "06:30",
        "close": "22:00"
      },
      "sunday": {
        "open": "06:30",
        "close": "22:00"
      }
    },
    "dishes": [
      {
        "name": "Pain complet aux céréales",
        "category": "Desserts",
        "price": 1677
      },
      {
        "name": "Chausson aux pommes",
        "category": "Desserts",
        "price": 2500
      },
      {
        "name": "Sandwich Mixte (jambon, emmental)",
        "category": "Plats Principaux",
        "price": 6039
      },
      {
        "name": "Salade Quinoa Gourmande",
        "category": "Entrées",
        "price": 1800
      },
      {
        "name": "Tartelette fine au citron meringuée",
        "category": "Desserts",
        "price": 2561
      },
      {
        "name": "Palmier croustillant au chocolat",
        "category": "Desserts",
        "price": 2184
      },
      {
        "name": "Soupe du jour artisanale",
        "category": "Entrées",
        "price": 4345
      },
      {
        "name": "Cappuccino mousseux",
        "category": "Boissons",
        "price": 2966
      },
      {
        "name": "Jus de mangue locale frais",
        "category": "Boissons",
        "price": 1928
      },
      {
        "name": "Paris-Brest revisité",
        "category": "Desserts",
        "price": 1106
      }
    ]
  },
  {
    "name": "PAUL - Aéroport",
    "street": "Hall des départs, Aéroport International Léon-Mba, Libreville, Gabon",
    "district": "Aéroport",
    "coordinates": [
      9.412,
      0.458
    ],
    "phone": "+24111745504",
    "email": "paul.aeroport@paul.ga",
    "hoursText": "Ouvert tous les jours de 05h00 à 23h00",
    "hours": {
      "monday": {
        "open": "05:00",
        "close": "23:00"
      },
      "tuesday": {
        "open": "05:00",
        "close": "23:00"
      },
      "wednesday": {
        "open": "05:00",
        "close": "23:00"
      },
      "thursday": {
        "open": "05:00",
        "close": "23:00"
      },
      "friday": {
        "open": "05:00",
        "close": "23:00"
      },
      "saturday": {
        "open": "05:00",
        "close": "23:00"
      },
      "sunday": {
        "open": "05:00",
        "close": "23:00"
      }
    },
    "dishes": [
      {
        "name": "Menu Petit-Déjeuner Express",
        "category": "Plats Principaux",
        "price": 10728
      },
      {
        "name": "Sandwich Poulet Crudités",
        "category": "Plats Principaux",
        "price": 5481
      },
      {
        "name": "Croissant gourmand aux amandes",
        "category": "Desserts",
        "price": 1969
      },
      {
        "name": "Tartelette fraîche aux fraises",
        "category": "Desserts",
        "price": 2087
      },
      {
        "name": "Moelleux au chocolat intense",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Salade Niçoise au thon",
        "category": "Entrées",
        "price": 1782
      },
      {
        "name": "Chausson salé à la viande",
        "category": "Desserts",
        "price": 2500
      },
      {
        "name": "Café Expresso serré",
        "category": "Boissons",
        "price": 1596
      },
      {
        "name": "Jus de fruits tropicaux",
        "category": "Boissons",
        "price": 1762
      },
      {
        "name": "Boîte de macarons assortis (à emporter)",
        "category": "Desserts",
        "price": 2915
      }
    ]
  },
  {
    "name": "PAUL - Centre ville",
    "street": "Place de l'Indépendance, Centre-ville, Libreville, Gabon",
    "district": "Centre-ville",
    "coordinates": [
      9.449,
      0.392
    ],
    "phone": "+24111745505",
    "email": "paul.centreville@paul.ga",
    "hoursText": "Ouvert tous les jours de 06h30 à 20h00",
    "hours": {
      "monday": {
        "open": "06:30",
        "close": "20:00"
      },
      "tuesday": {
        "open": "06:30",
        "close": "20:00"
      },
      "wednesday": {
        "open": "06:30",
        "close": "20:00"
      },
      "thursday": {
        "open": "06:30",
        "close": "20:00"
      },
      "friday": {
        "open": "06:30",
        "close": "20:00"
      },
      "saturday": {
        "open": "06:30",
        "close": "20:00"
      },
      "sunday": {
        "open": "06:30",
        "close": "20:00"
      }
    },
    "dishes": [
      {
        "name": "Baguette aux six céréales",
        "category": "Desserts",
        "price": 1686
      },
      {
        "name": "Escargot aux raisins",
        "category": "Desserts",
        "price": 2500
      },
      {
        "name": "Panini chaud Poulet Mozzarella",
        "category": "Plats Principaux",
        "price": 5910
      },
      {
        "name": "Salade de chèvre chaud sur toast",
        "category": "Entrées",
        "price": 1531
      },
      {
        "name": "Éclair au chocolat traditionnel",
        "category": "Desserts",
        "price": 2171
      },
      {
        "name": "Tartelette fine aux pommes",
        "category": "Desserts",
        "price": 1558
      },
      {
        "name": "Club Sandwich à la dinde",
        "category": "Plats Principaux",
        "price": 5280
      },
      {
        "name": "Café Américano",
        "category": "Boissons",
        "price": 1073
      },
      {
        "name": "Smoothie aux fruits de la passion",
        "category": "Boissons",
        "price": 1172
      },
      {
        "name": "Financier aux amandes",
        "category": "Desserts",
        "price": 1037
      }
    ]
  },
  {
    "name": "PAUL - Baie Des Rois",
    "street": "Promenade de la Baie des Rois, Libreville, Gabon",
    "district": "Baie des Rois",
    "coordinates": [
      9.454,
      0.387
    ],
    "phone": "+24111745506",
    "email": "paul.baiedesrois@paul.ga",
    "hoursText": "Ouvert tous les jours de 07h00 à 23h00",
    "hours": {
      "monday": {
        "open": "07:00",
        "close": "23:00"
      },
      "tuesday": {
        "open": "07:00",
        "close": "23:00"
      },
      "wednesday": {
        "open": "07:00",
        "close": "23:00"
      },
      "thursday": {
        "open": "07:00",
        "close": "23:00"
      },
      "friday": {
        "open": "07:00",
        "close": "23:00"
      },
      "saturday": {
        "open": "07:00",
        "close": "23:00"
      },
      "sunday": {
        "open": "07:00",
        "close": "23:00"
      }
    },
    "dishes": [
      {
        "name": "Viennoise au chocolat",
        "category": "Desserts",
        "price": 1066
      },
      {
        "name": "Sandwich Tomate Mozzarella Pesto",
        "category": "Plats Principaux",
        "price": 6111
      },
      {
        "name": "Salade Burrata et tomates d'antan",
        "category": "Entrées",
        "price": 1484
      },
      {
        "name": "Éclair de saison aux fruits",
        "category": "Desserts",
        "price": 1708
      },
      {
        "name": "Tartelette multifruits",
        "category": "Desserts",
        "price": 1309
      },
      {
        "name": "Pain perdu gourmand au caramel",
        "category": "Desserts",
        "price": 1863
      },
      {
        "name": "Milkshake Paul façon glacier",
        "category": "Boissons",
        "price": 2296
      },
      {
        "name": "Jus de bissap frais revisité",
        "category": "Boissons",
        "price": 2316
      },
      {
        "name": "Mocktail de fruits frais pressés",
        "category": "Boissons",
        "price": 1254
      },
      {
        "name": "Croissant salé au saumon et crème",
        "category": "Desserts",
        "price": 2407
      }
    ]
  },
  {
    "name": "Cacao",
    "street": "Quartier Batterie IV, Libreville, Gabon",
    "district": "Batterie IV",
    "coordinates": [
      9.462,
      0.448
    ],
    "phone": "+24166128844",
    "email": "contact@cacaolounge.ga",
    "hoursText": "Ouvert du mardi au dimanche de 10h00 à 22h00",
    "hours": {
      "monday": null,
      "tuesday": {
        "open": "10:00",
        "close": "22:00"
      },
      "wednesday": {
        "open": "10:00",
        "close": "22:00"
      },
      "thursday": {
        "open": "10:00",
        "close": "22:00"
      },
      "friday": {
        "open": "10:00",
        "close": "22:00"
      },
      "saturday": {
        "open": "10:00",
        "close": "22:00"
      },
      "sunday": {
        "open": "10:00",
        "close": "22:00"
      }
    },
    "dishes": [
      {
        "name": "Fondant signature au pur cacao du Gabon",
        "category": "Desserts",
        "price": 2647
      },
      {
        "name": "Truffes en chocolat faites maison",
        "category": "Plats Principaux",
        "price": 2201
      },
      {
        "name": "Moelleux chocolat-passion",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Crêpe Mikado au chocolat chaud coulant",
        "category": "Boissons",
        "price": 1717
      },
      {
        "name": "Café gourmand Cacao et ses mignardises",
        "category": "Boissons",
        "price": 1711
      },
      {
        "name": "Salade fraîcheur mangue-avocat",
        "category": "Entrées",
        "price": 1454
      },
      {
        "name": "Filet de bœuf sauce réduction au chocolat noir",
        "category": "Plats Principaux",
        "price": 4213
      },
      {
        "name": "Club Sandwich Premium",
        "category": "Plats Principaux",
        "price": 5006
      },
      {
        "name": "Smoothie Détox cacao-banane",
        "category": "Boissons",
        "price": 1111
      },
      {
        "name": "Tartelette chocolat-caramel beurre salé",
        "category": "Desserts",
        "price": 2962
      }
    ]
  },
  {
    "name": "King Of Tacos",
    "street": "Carrefour JDO, Libreville, Gabon",
    "district": "Carrefour JDO",
    "coordinates": [
      9.47,
      0.44
    ],
    "phone": "+24174521010",
    "email": "kingoftacos.lbv@gmail.com",
    "hoursText": "Ouvert tous les jours de 11h00 à 01h00",
    "hours": {
      "monday": {
        "open": "11:00",
        "close": "01:00"
      },
      "tuesday": {
        "open": "11:00",
        "close": "01:00"
      },
      "wednesday": {
        "open": "11:00",
        "close": "01:00"
      },
      "thursday": {
        "open": "11:00",
        "close": "01:00"
      },
      "friday": {
        "open": "11:00",
        "close": "01:00"
      },
      "saturday": {
        "open": "11:00",
        "close": "01:00"
      },
      "sunday": {
        "open": "11:00",
        "close": "01:00"
      }
    },
    "dishes": [
      {
        "name": "Tacos Simple (1 viande au choix)",
        "category": "Plats Principaux",
        "price": 5798
      },
      {
        "name": "Tacos Double (2 viandes + frites)",
        "category": "Accompagnements",
        "price": 5842
      },
      {
        "name": "Tacos Triple Le Roi (3 viandes + sauce fromagère)",
        "category": "Plats Principaux",
        "price": 3893
      },
      {
        "name": "French Tacos Cordon Bleu Nuggets",
        "category": "Accompagnements",
        "price": 5970
      },
      {
        "name": "Tacos Poulet Tikka épicé",
        "category": "Plats Principaux",
        "price": 5517
      },
      {
        "name": "Frites nappées de sauce fromagère maison",
        "category": "Accompagnements",
        "price": 1318
      },
      {
        "name": "Jalapeños Cheese (bouchées pimentées)",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Wrap Crousti-Poulet",
        "category": "Plats Principaux",
        "price": 4865
      },
      {
        "name": "Box Tenders de poulet pané",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Milkshake Oréo gourmand",
        "category": "Boissons",
        "price": 1882
      }
    ]
  },
  {
    "name": "KFC - Aéroport",
    "street": "Zone commerciale de l'Aéroport International Léon-Mba, Libreville, Gabon",
    "district": "Aéroport",
    "coordinates": [
      9.412,
      0.458
    ],
    "phone": "+24111448889",
    "email": "contact@kfc.ga",
    "hoursText": "Ouvert tous les jours de 10h00 à 23h00",
    "hours": {
      "monday": {
        "open": "10:00",
        "close": "23:00"
      },
      "tuesday": {
        "open": "10:00",
        "close": "23:00"
      },
      "wednesday": {
        "open": "10:00",
        "close": "23:00"
      },
      "thursday": {
        "open": "10:00",
        "close": "23:00"
      },
      "friday": {
        "open": "10:00",
        "close": "23:00"
      },
      "saturday": {
        "open": "10:00",
        "close": "23:00"
      },
      "sunday": {
        "open": "10:00",
        "close": "23:00"
      }
    },
    "dishes": [
      {
        "name": "Bucket de 10 Tenders croustillants",
        "category": "Plats Principaux",
        "price": 6188
      },
      {
        "name": "Menu Zinger Burger",
        "category": "Plats Principaux",
        "price": 4707
      },
      {
        "name": "Colonel Burger",
        "category": "Plats Principaux",
        "price": 4363
      },
      {
        "name": "Twister Wrap pimenté",
        "category": "Plats Principaux",
        "price": 5114
      },
      {
        "name": "Frites dorées classiques",
        "category": "Accompagnements",
        "price": 942
      },
      {
        "name": "Poulet Popcorn format géant",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Hot Wings épicés (x8)",
        "category": "Accompagnements",
        "price": 1668
      },
      {
        "name": "Menu Enfant Box surprise",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Salade Coleslaw fraîche",
        "category": "Entrées",
        "price": 1930
      },
      {
        "name": "Sundae au caramel",
        "category": "Desserts",
        "price": 2611
      }
    ]
  },
  {
    "name": "KFC - Glass",
    "street": "Boulevard Triomphal (Axe Glass), Libreville, Gabon",
    "district": "Glass",
    "coordinates": [
      9.447,
      0.398
    ],
    "phone": "+24111448890",
    "email": "contact@kfc.ga",
    "hoursText": "Ouvert tous les jours de 10h00 à 23h00",
    "hours": {
      "monday": {
        "open": "10:00",
        "close": "23:00"
      },
      "tuesday": {
        "open": "10:00",
        "close": "23:00"
      },
      "wednesday": {
        "open": "10:00",
        "close": "23:00"
      },
      "thursday": {
        "open": "10:00",
        "close": "23:00"
      },
      "friday": {
        "open": "10:00",
        "close": "23:00"
      },
      "saturday": {
        "open": "10:00",
        "close": "23:00"
      },
      "sunday": {
        "open": "10:00",
        "close": "23:00"
      }
    },
    "dishes": [
      {
        "name": "Bucket Solo (3 morceaux de poulet + frites)",
        "category": "Accompagnements",
        "price": 3304
      },
      {
        "name": "Boxmaster Original Poulet",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Menu Krushem KitKat",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Riz épicé et son poulet croustillant",
        "category": "Accompagnements",
        "price": 982
      },
      {
        "name": "Filet de poulet pané gourmet",
        "category": "Plats Principaux",
        "price": 5817
      },
      {
        "name": "Long Burger Poulet",
        "category": "Plats Principaux",
        "price": 4712
      },
      {
        "name": "Nuggets de poulet (x9)",
        "category": "Accompagnements",
        "price": 1552
      },
      {
        "name": "Tarte aux pommes chaude maison",
        "category": "Desserts",
        "price": 1895
      },
      {
        "name": "Salade verte au poulet grillé",
        "category": "Entrées",
        "price": 1312
      },
      {
        "name": "Milkshake onctueux à la Vanille",
        "category": "Boissons",
        "price": 1082
      }
    ]
  },
  {
    "name": "Bantu",
    "street": "Quartier Louis, Libreville, Gabon",
    "district": "Louis",
    "coordinates": [
      9.44,
      0.45
    ],
    "phone": "+24165123456",
    "email": "contact@bantu-restaurant.ga",
    "hoursText": "Ouvert tous les jours de 12h00 à 23h00",
    "hours": {
      "monday": {
        "open": "12:00",
        "close": "23:00"
      },
      "tuesday": {
        "open": "12:00",
        "close": "23:00"
      },
      "wednesday": {
        "open": "12:00",
        "close": "23:00"
      },
      "thursday": {
        "open": "12:00",
        "close": "23:00"
      },
      "friday": {
        "open": "12:00",
        "close": "23:00"
      },
      "saturday": {
        "open": "12:00",
        "close": "23:00"
      },
      "sunday": {
        "open": "12:00",
        "close": "23:00"
      }
    },
    "dishes": [
      {
        "name": "Poulet au Nyembwe traditionnel",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Capitaine braisé entier aux épices locales",
        "category": "Plats Principaux",
        "price": 3816
      },
      {
        "name": "Coupé-coupé de bœuf sauté aux oignons",
        "category": "Plats Principaux",
        "price": 3650
      },
      {
        "name": "Brochettes de porc au piment doux",
        "category": "Plats Principaux",
        "price": 6155
      },
      {
        "name": "Crabe farci à la gabonaise",
        "category": "Plats Principaux",
        "price": 5488
      },
      {
        "name": "Manioc vapeur (Chikwangue)",
        "category": "Plats Principaux",
        "price": 831
      },
      {
        "name": "Alloco mûr frit",
        "category": "Plats Principaux",
        "price": 1176
      },
      {
        "name": "Sardines fumées locales accompagnées de banane bouillie",
        "category": "Plats Principaux",
        "price": 1582
      },
      {
        "name": "Gibier du jour en sauce saka-saka",
        "category": "Plats Principaux",
        "price": 6036
      },
      {
        "name": "Salade fraîcheur avocat et crevettes de l'estuaire",
        "category": "Entrées",
        "price": 910
      }
    ]
  },
  {
    "name": "Mystic Bantu",
    "street": "Quartier Sablière, Akanda, Gabon",
    "district": "Akanda",
    "coordinates": [
      9.445,
      0.52
    ],
    "phone": "+24174889900",
    "email": "reservation@mysticbantu.ga",
    "hoursText": "Ouvert tous les jours de 16h00 à 02h00",
    "hours": {
      "monday": {
        "open": "16:00",
        "close": "02:00"
      },
      "tuesday": {
        "open": "16:00",
        "close": "02:00"
      },
      "wednesday": {
        "open": "16:00",
        "close": "02:00"
      },
      "thursday": {
        "open": "16:00",
        "close": "02:00"
      },
      "friday": {
        "open": "16:00",
        "close": "02:00"
      },
      "saturday": {
        "open": "16:00",
        "close": "02:00"
      },
      "sunday": {
        "open": "16:00",
        "close": "02:00"
      }
    },
    "dishes": [
      {
        "name": "Tapas de banane plantain au fromage de chèvre",
        "category": "Plats Principaux",
        "price": 1515
      },
      {
        "name": "Mini-burgers Bantu au pain de manioc",
        "category": "Plats Principaux",
        "price": 6340
      },
      {
        "name": "Brochettes de filet de bœuf laquées au miel local",
        "category": "Plats Principaux",
        "price": 4432
      },
      {
        "name": "Gambas géantes grillées au feu de bois",
        "category": "Plats Principaux",
        "price": 3304
      },
      {
        "name": "Tartare de thon passion-gingembre",
        "category": "Entrées",
        "price": 2714
      },
      {
        "name": "Poulet braisé mariné façon Mystic",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Ailerons de poulet croustillants sauce barbecue-piment",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Frites de patates douces maison",
        "category": "Accompagnements",
        "price": 1392
      },
      {
        "name": "Carpaccio de poisson blanc de l'Atlantique",
        "category": "Entrées",
        "price": 3448
      },
      {
        "name": "Cocktail signature Mystic aux fruits exotiques",
        "category": "Boissons",
        "price": 1080
      }
    ]
  },
  {
    "name": "Maison M",
    "street": "Quartier Louis, Libreville, Gabon",
    "district": "Louis",
    "coordinates": [
      9.44,
      0.45
    ],
    "phone": "+24111732222",
    "email": "contact@maisonm-lbv.com",
    "hoursText": "Ouvert du lundi au samedi de 12h00 à 15h00 et de 19h30 à 23h00",
    "hours": {
      "monday": {
        "open": "12:00",
        "close": "23:00"
      },
      "tuesday": {
        "open": "12:00",
        "close": "23:00"
      },
      "wednesday": {
        "open": "12:00",
        "close": "23:00"
      },
      "thursday": {
        "open": "12:00",
        "close": "23:00"
      },
      "friday": {
        "open": "12:00",
        "close": "23:00"
      },
      "saturday": {
        "open": "12:00",
        "close": "23:00"
      },
      "sunday": null
    },
    "dishes": [
      {
        "name": "Filet de bœuf Rossini et sa purée maison",
        "category": "Plats Principaux",
        "price": 12077
      },
      {
        "name": "Magret de canard sauce aux figues",
        "category": "Plats Principaux",
        "price": 11092
      },
      {
        "name": "Filet de Capitaine sauce armoricaine",
        "category": "Plats Principaux",
        "price": 6430
      },
      {
        "name": "Risotto crémeux aux champignons sauvages",
        "category": "Plats Principaux",
        "price": 3648
      },
      {
        "name": "Foie gras de canard poêlé",
        "category": "Plats Principaux",
        "price": 5560
      },
      {
        "name": "Tartare de bœuf traditionnel préparé à la table",
        "category": "Entrées",
        "price": 2059
      },
      {
        "name": "Salade Maison M (gourmande)",
        "category": "Entrées",
        "price": 815
      },
      {
        "name": "Profiteroles au chocolat chaud coulant",
        "category": "Boissons",
        "price": 2739
      },
      {
        "name": "Tarte Tatin et sa boule de glace vanille",
        "category": "Desserts",
        "price": 2667
      },
      {
        "name": "Plateau de fromages affinés importés",
        "category": "Plats Principaux",
        "price": 11776
      }
    ]
  },
  {
    "name": "L'iroko",
    "street": "Bas de Gué-Gué, Libreville, Gabon",
    "district": "Gué-Gué",
    "coordinates": [
      9.475,
      0.415
    ],
    "phone": "+24162451212",
    "email": "info@liroko-lounge.com",
    "hoursText": "Ouvert tous les jours de 11h30 à 23h00",
    "hours": {
      "monday": {
        "open": "11:30",
        "close": "23:00"
      },
      "tuesday": {
        "open": "11:30",
        "close": "23:00"
      },
      "wednesday": {
        "open": "11:30",
        "close": "23:00"
      },
      "thursday": {
        "open": "11:30",
        "close": "23:00"
      },
      "friday": {
        "open": "11:30",
        "close": "23:00"
      },
      "saturday": {
        "open": "11:30",
        "close": "23:00"
      },
      "sunday": {
        "open": "11:30",
        "close": "23:00"
      }
    },
    "dishes": [
      {
        "name": "Mix-grill L'Iroko (bœuf, poulet, merguez)",
        "category": "Plats Principaux",
        "price": 11901
      },
      {
        "name": "Bar de l'estuaire braisé au piment",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Poulet DG revisité",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Côte de bœuf grillée pour deux personnes",
        "category": "Plats Principaux",
        "price": 12330
      },
      {
        "name": "Brochettes de lotte locale et légumes grillés",
        "category": "Plats Principaux",
        "price": 4100
      },
      {
        "name": "Kondre de porc (ragoût de plantain)",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Salade César au poulet croustillant",
        "category": "Entrées",
        "price": 1933
      },
      {
        "name": "Frites de pomme de terre maison",
        "category": "Accompagnements",
        "price": 1316
      },
      {
        "name": "Chikwangue locale tiède",
        "category": "Plats Principaux",
        "price": 1971
      },
      {
        "name": "Mousse au chocolat noir intense",
        "category": "Desserts",
        "price": 2020
      }
    ]
  },
  {
    "name": "Tivoli",
    "street": "Quartier Montagne Sainte, Libreville, Gabon",
    "district": "Montagne Sainte",
    "coordinates": [
      9.435,
      0.415
    ],
    "phone": "+24111761010",
    "email": "tivoli.patisserie@yahoo.fr",
    "hoursText": "Ouvert tous les jours de 07h00 à 21h00",
    "hours": {
      "monday": {
        "open": "07:00",
        "close": "21:00"
      },
      "tuesday": {
        "open": "07:00",
        "close": "21:00"
      },
      "wednesday": {
        "open": "07:00",
        "close": "21:00"
      },
      "thursday": {
        "open": "07:00",
        "close": "21:00"
      },
      "friday": {
        "open": "07:00",
        "close": "21:00"
      },
      "saturday": {
        "open": "07:00",
        "close": "21:00"
      },
      "sunday": {
        "open": "07:00",
        "close": "21:00"
      }
    },
    "dishes": [
      {
        "name": "Mille-feuille traditionnel Tivoli",
        "category": "Desserts",
        "price": 2273
      },
      {
        "name": "Croissant au beurre et café au lait (Formule)",
        "category": "Boissons",
        "price": 1230
      },
      {
        "name": "Sandwich Américain complet (bœuf, frites, œuf)",
        "category": "Accompagnements",
        "price": 4305
      },
      {
        "name": "Steak frites sauce au poivre vert",
        "category": "Accompagnements",
        "price": 6170
      },
      {
        "name": "Lasagnes à la bolognaise maison",
        "category": "Plats Principaux",
        "price": 6077
      },
      {
        "name": "Pizza Reine (jambon, champignons, fromage)",
        "category": "Plats Principaux",
        "price": 3364
      },
      {
        "name": "Coupe de glaces artisanales 3 boules au choix",
        "category": "Plats Principaux",
        "price": 2500
      },
      {
        "name": "Éclair au chocolat croustillant",
        "category": "Desserts",
        "price": 2194
      },
      {
        "name": "Salade Niçoise au thon frais",
        "category": "Entrées",
        "price": 1146
      },
      {
        "name": "Quiche aux lardons et fromage",
        "category": "Plats Principaux",
        "price": 5778
      }
    ]
  },
  {
    "name": "Eat Vite",
    "street": "Carrefour JDO, Libreville, Gabon",
    "district": "Carrefour JDO",
    "coordinates": [
      9.47,
      0.44
    ],
    "phone": "+24177334455",
    "email": "order@eatvite-ga.com",
    "hoursText": "Ouvert tous les jours de 10h00 à 23h30",
    "hours": {
      "monday": {
        "open": "10:00",
        "close": "23:30"
      },
      "tuesday": {
        "open": "10:00",
        "close": "23:30"
      },
      "wednesday": {
        "open": "10:00",
        "close": "23:30"
      },
      "thursday": {
        "open": "10:00",
        "close": "23:30"
      },
      "friday": {
        "open": "10:00",
        "close": "23:30"
      },
      "saturday": {
        "open": "10:00",
        "close": "23:30"
      },
      "sunday": {
        "open": "10:00",
        "close": "23:30"
      }
    },
    "dishes": [
      {
        "name": "Chawarma Poulet grand format",
        "category": "Plats Principaux",
        "price": 5706
      },
      {
        "name": "Chawarma Bœuf spécial sauce blanche",
        "category": "Plats Principaux",
        "price": 3170
      },
      {
        "name": "Burger Eat Vite Double Cheese",
        "category": "Plats Principaux",
        "price": 5625
      },
      {
        "name": "Panini chaud Poulet-Fromage",
        "category": "Plats Principaux",
        "price": 5571
      },
      {
        "name": "Menu Wings de poulet épicés (x6)",
        "category": "Accompagnements",
        "price": 1501
      },
      {
        "name": "Tenders de poulet avec frites",
        "category": "Accompagnements",
        "price": 1185
      },
      {
        "name": "Tacos Double viandes sauce fromagère",
        "category": "Plats Principaux",
        "price": 3094
      },
      {
        "name": "Hot Dog classique ketchup-moutarde",
        "category": "Plats Principaux",
        "price": 6313
      },
      {
        "name": "Portion de frites grand format",
        "category": "Accompagnements",
        "price": 1300
      },
      {
        "name": "Milkshake saveur Oréo",
        "category": "Boissons",
        "price": 1683
      }
    ]
  }
];

// ============ users : nous créons 30 clients ============
const customerIds = [];
const customers = [];
for (let i = 0; i < 30; i++) {
  const id = ObjectId();
  customerIds.push(id);
  const { firstName, lastName } = gabonName(i);
  const district = DISTRICTS[i % DISTRICTS.length];
  customers.push({
    _id: id,
    email: `customer${i + 1}@librevilleeats.ga`,
    password: CLEAR_PASSWORD,
    role: 'CUSTOMER',
    profile: { firstName, lastName, phone: `+241${randomChoice(['06', '07'])}${randomInt(1000000, 9999999)}` },
    addresses: [
      {
        label: 'Domicile',
        district,
        coordinates: { type: 'Point', coordinates: DISTRICT_COORDINATES[district] || [9.4500, 0.4200] },
        isDefault: true,
      },
    ],
    isActive: true,
    metadata: { createdAt: new Date('2024-01-10'), updatedAt: new Date('2024-01-10') },
  });
}
db.users.insertMany(customers);

// ============ users : nous créons 30 restaurateurs (1 par restaurant réel) ============
const vendorIds = [];
const vendors = [];
for (let i = 0; i < REAL_RESTAURANTS.length; i++) {
  const id = ObjectId();
  vendorIds.push(id);
  const { firstName, lastName } = gabonName(i + 30);
  const slug = REAL_RESTAURANTS[i].name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  vendors.push({
    _id: id,
    email: `vendor-${slug}@librevilleeats.ga`,
    password: CLEAR_PASSWORD,
    role: 'VENDOR',
    profile: { firstName, lastName, phone: REAL_RESTAURANTS[i].phone },
    addresses: [],
    isActive: true,
    metadata: { createdAt: new Date('2024-01-05'), updatedAt: new Date('2024-01-05') },
  });
}
db.users.insertMany(vendors);

// ============ users : nous créons 30 livreurs ============
const delivererUserIds = [];
const delivererUsers = [];
for (let i = 0; i < 30; i++) {
  const id = ObjectId();
  delivererUserIds.push(id);
  const { firstName, lastName } = gabonName(i + 60);
  delivererUsers.push({
    _id: id,
    email: delivererEmail(firstName, lastName),
    password: CLEAR_PASSWORD,
    role: 'DELIVERER',
    profile: { firstName, lastName, phone: `+241${randomChoice(['06', '07'])}${randomInt(1000000, 9999999)}` },
    addresses: [],
    isActive: true,
    metadata: { createdAt: new Date('2024-01-08'), updatedAt: new Date('2024-01-08') },
  });
}
db.users.insertMany(delivererUsers);

// ============ restaurants : nous créons 30 enseignes réelles avec menus réels ============
const restaurantIds = [];
const restaurants = REAL_RESTAURANTS.map((r, i) => {
  const id = ObjectId();
  restaurantIds.push(id);
  return {
    _id: id,
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
    // isOpen) — répartis sur chaque tranche de 10 plutôt que regroupés
    // par enseigne.
    isOpen: (i % 10) >= 6,
    rating: parseFloat((randomInt(35, 50) / 10).toFixed(1)),
    reviewCount: randomInt(50, 300),
    menus: [
      {
        name: 'Menu',
        description: r.hoursText,
        // Nous mettons 10 à 15% des plats de CHAQUE restaurant en rupture de stock —
        // avec 10 plats par restaurant, 1 plat (10%) tombe dans cette
        // fourchette ; nous faisons varier l'indice par restaurant (i) pour ne pas
        // toujours désactiver le même plat.
        dishes: (() => {
          const outOfStockCount = Math.max(1, Math.round(r.dishes.length * 0.12));
          const outOfStockIndexes = new Set(
            Array.from({ length: outOfStockCount }, (_, k) => (i + k * 3) % r.dishes.length)
          );
          return r.dishes.map((d, j) => {
            const outOfStock = outOfStockIndexes.has(j);
            return {
              name: d.name,
              price: d.price,
              currency: 'FCFA',
              category: d.category,
              isAvailable: !outOfStock,
              quantity: outOfStock ? 0 : randomInt(20, 100),
            };
          });
        })(),
      },
    ],
    deliveryZones: [{ zone: r.district, deliveryFee: randomInt(800, 2000), deliveryTime: randomInt(20, 45) }],
    owner_id: vendorIds[i],
    metadata: { createdAt: new Date('2024-01-05'), updatedAt: new Date('2024-01-05'), totalOrders: 0, totalRevenue: 0 },
  };
});
db.restaurants.insertMany(restaurants);

// ============ deliverers : nous créons 30 profils livreurs ============
const delivererIds = [];
const deliverers = [];
const vehicleTypes = ['MOTORCYCLE', 'SCOOTER', 'BICYCLE'];
for (let i = 0; i < 30; i++) {
  const id = ObjectId();
  delivererIds.push(id);
  const user = delivererUsers[i];
  const district = DISTRICTS[i % DISTRICTS.length];
  deliverers.push({
    _id: id,
    user_id: user._id,
    personalInfo: {
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      phone: user.profile.phone,
      email: user.email,
    },
    vehicleInfo: { type: randomChoice(vehicleTypes), licensePlate: `LA2024${String(i).padStart(3, '0')}`, color: randomChoice(['Rouge', 'Bleu', 'Jaune', 'Vert', 'Noir']) },
    currentLocation: { type: 'Point', coordinates: DISTRICT_COORDINATES[district] || [9.4500, 0.4200], lastUpdated: new Date() },
    isActive: true,
    isAvailable: Math.random() > 0.3,
    performanceMetrics: { totalDeliveries: randomInt(10, 300), totalEarnings: randomInt(50000, 800000), averageRating: parseFloat((randomInt(38, 50) / 10).toFixed(1)), ratingCount: randomInt(10, 150), cancelledDeliveries: randomInt(0, 8), averageDeliveryTime: randomInt(18, 35) },
    metadata: { createdAt: new Date('2024-01-08'), updatedAt: new Date('2024-01-08') },
  });
}
db.deliverers.insertMany(deliverers);

// ============ commandes : nous créons 1 commande par restaurant (30) ============
const STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERY_IN_PROGRESS', 'DELIVERED', 'CANCELLED'];
const commandes = REAL_RESTAURANTS.map((r, i) => {
  const status = STATUSES[i % STATUSES.length];
  const dish1 = r.dishes[i % r.dishes.length];
  const dish2 = r.dishes[(i + 1) % r.dishes.length];
  const subtotal = dish1.price + dish2.price;
  const deliveryFee = randomInt(800, 2000);
  const createdAt = new Date(2024, 1, 1 + (i % 28), 10 + (i % 10), 0, 0);

  const statusHistory = [{ status: 'PENDING', timestamp: createdAt, note: 'Commande créée' }];
  if (status !== 'PENDING') {
    statusHistory.push({ status: status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED', timestamp: new Date(createdAt.getTime() + 5 * 60000), note: status === 'CANCELLED' ? 'Annulée par le client' : 'Restaurant a confirmé' });
  }

  return {
    customer_id: customerIds[i % customerIds.length],
    restaurant_id: restaurantIds[i],
    deliverer_id: status === 'PENDING' || status === 'CANCELLED' ? null : delivererIds[i % delivererIds.length],
    items: [
      { dishName: dish1.name, quantity: 1, unitPrice: dish1.price, totalPrice: dish1.price },
      { dishName: dish2.name, quantity: 1, unitPrice: dish2.price, totalPrice: dish2.price },
    ],
    pricing: { subtotal, deliveryFee, discount: 0, tax: 0, total: subtotal + deliveryFee, currency: 'FCFA' },
    status,
    statusHistory,
    deliveryTracking: status === 'DELIVERED' || status === 'DELIVERY_IN_PROGRESS'
      ? [{ timestamp: new Date(createdAt.getTime() + 20 * 60000), coordinates: { type: 'Point', coordinates: r.coordinates }, speed: randomInt(20, 35) }]
      : [],
    deliveryInfo: { type: i % 4 === 0 ? 'PICKUP' : 'DELIVERY', recipientName: `${customers[i % customers.length].profile.firstName} ${customers[i % customers.length].profile.lastName}`, recipientPhone: customers[i % customers.length].profile.phone },
    payment: { method: randomChoice(['CASH', 'MOBILE_MONEY', 'CARD']), status: status === 'DELIVERED' ? 'COMPLETED' : status === 'CANCELLED' ? 'FAILED' : 'PENDING' },
    metadata: { createdAt, updatedAt: new Date(createdAt.getTime() + 10 * 60000) },
  };
});
db.commandes.insertMany(commandes);

print('Seed terminé : ' + db.users.countDocuments() + ' users (30 clients, 30 restaurateurs, 30 livreurs), ' +
  db.restaurants.countDocuments() + ' restaurants, ' +
  db.deliverers.countDocuments() + ' deliverers, ' +
  db.commandes.countDocuments() + ' commandes.');
print('Mot de passe en clair pour tous les comptes : ' + CLEAR_PASSWORD);
