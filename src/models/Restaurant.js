const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom du restaurant est obligatoire'],
      minlength: 3,
      maxlength: 100,
    },

    email: {
      type: String,
      required: [true, "L'e-mail est obligatoire"],
      lowercase: true,
    },

    phone: {
      type: String,
      required: [true, 'Le téléphone est obligatoire'],
      match: [/^\+241\d{8}$/, 'Format attendu : +241XXXXXXXX'],
    },

    image: String,

    address: {
      street: {
        type: String,
        required: [true, "L'adresse (rue) est obligatoire"],
      },
      district: {
        type: String,
        required: [true, 'Le quartier est obligatoire'],
        enum: [
          'Nombakélé',
          'Batavéa',
          'Deïdate',
          'Gué-Gué',
          'Okala',
          'Nkembo',
          'Akébé',
          'Lalala',
          'PK5',
          'Santa-Marija',
          'Nzeng Ayong',
          'Owendo',
          'Akanda',
          '3 Quartiers',
          'Glass',
          'Baie des Rois',
          'Batterie IV',
          'Carrefour JDO',
          'Centre-ville',
          'Aéroport',
          'Montagne Sainte',
          'Louis',
        ],
      },
      city: {
        type: String,
        default: 'Libreville',
      },
      zipCode: String,
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
        },
        coordinates: {
          type: [Number],
        },
      },
    },

    // Nous modélisons ici les horaires d'ouverture
    hours: {
      monday: {
        open: String,
        close: String,
      },
      tuesday: {
        open: String,
        close: String,
      },
      wednesday: {
        open: String,
        close: String,
      },
      thursday: {
        open: String,
        close: String,
      },
      friday: {
        open: String,
        close: String,
      },
      saturday: {
        open: String,
        close: String,
      },
      sunday: {
        open: String,
        close: String,
      },
    },

    isOpen: {
      type: Boolean,
      default: true,
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    reviewCount: {
      type: Number,
      default: 0,
    },

    // Nous embarquons directement les menus et leurs plats au sein du document
    menus: [
      {
        name: {
          type: String,
          required: true,
        },
        description: String,
        dishes: [
          {
            name: {
              type: String,
              required: true,
            },
            description: String,
            price: {
              type: Number,
              required: true,
              min: 0,
            },
            currency: {
              type: String,
              default: 'FCFA',
            },
            category: {
              type: String,
              enum: [
                'Plats Principaux',
                'Accompagnements',
                'Desserts',
                'Boissons',
                'Entrées',
              ],
            },
            isAvailable: {
              type: Boolean,
              default: true,
            },
            quantity: {
              type: Number,
              default: 0,
            },
            image: String,
            preparationTime: {
              type: Number,
              default: 15,
            }, // nous exprimons cette durée en minutes
          },
        ],
      },
    ],

    deliveryZones: [
      {
        zone: String,
        deliveryFee: Number,
        deliveryTime: Number, // nous exprimons cette durée en minutes
      },
    ],

    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    metadata: {
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
      totalOrders: {
        type: Number,
        default: 0,
      },
      totalRevenue: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true }
);

// Nous créons un index géospatial afin de localiser les restaurants à proximité
restaurantSchema.index({ 'address.coordinates': '2dsphere' });

// Nous créons un index composé sur le quartier et le statut d'ouverture
restaurantSchema.index({ 'address.district': 1, 'isOpen': 1 });

// Nous créons un index afin d'accélérer les requêtes sur la disponibilité des plats
restaurantSchema.index({ 'menus.dishes.isAvailable': 1 });

// Nous créons un index text afin de permettre la recherche plein texte (nom du restaurant, description des menus et des plats)
restaurantSchema.index(
  {
    name: 'text',
    'menus.name': 'text',
    'menus.dishes.name': 'text',
    'menus.dishes.description': 'text',
  },
  {
    name: 'idx_text_search',
    weights: { name: 10, 'menus.dishes.name': 5, 'menus.name': 3, 'menus.dishes.description': 1 },
  }
);

module.exports = mongoose.model('Restaurant', restaurantSchema);
