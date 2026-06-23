const mongoose = require('mongoose');

// Machine à états des statuts de commande
const ORDER_STATUSES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY_FOR_DELIVERY: 'READY_FOR_DELIVERY',
  DELIVERY_IN_PROGRESS: 'DELIVERY_IN_PROGRESS',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
};

const commandeSchema = new mongoose.Schema(
  {
    // Références
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    restaurant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },

    deliverer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deliverer',
      default: null,
    },

    // Articles commandés (snapshot figé)
    items: [
      {
        dishId: mongoose.Schema.Types.ObjectId,
        dishName: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        unitPrice: {
          type: Number,
          required: true,
          min: 0,
        },
        totalPrice: {
          type: Number,
          required: true,
        },
      },
    ],

    // Détail des prix
    pricing: {
      subtotal: {
        type: Number,
        required: true,
      },
      deliveryFee: {
        type: Number,
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
      },
      tax: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: 'FCFA',
      },
    },

    // Statut et machine à états
    status: {
      type: String,
      enum: Object.values(ORDER_STATUSES),
      default: ORDER_STATUSES.PENDING,
    },

    // Historique des transitions de statut
    statusHistory: [
      {
        status: {
          type: String,
          enum: Object.values(ORDER_STATUSES),
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: String,
      },
    ],

    // Suivi GPS du livreur (série temporelle)
    deliveryTracking: [
      {
        timestamp: Date,
        coordinates: {
          type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
          },
          coordinates: [Number], // [longitude, latitude]
        },
        speed: Number, // km/h
        distance: Number, // km depuis le restaurant
      },
    ],

    // Informations de livraison
    deliveryInfo: {
      type: {
        type: String,
        enum: ['DELIVERY', 'PICKUP'],
        default: 'DELIVERY',
      },
      address: {
        street: String,
        district: String,
        city: {
          type: String,
          default: 'Libreville',
        },
        notes: String,
      },
      recipientName: String,
      recipientPhone: String,
      estimatedDeliveryTime: Date,
      actualDeliveryTime: Date,
    },

    // Paiement
    payment: {
      method: {
        type: String,
        enum: ['CASH', 'CARD', 'MOBILE_MONEY'],
        default: 'CASH',
      },
      status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED'],
        default: 'PENDING',
      },
      transactionId: String,
      transactionDate: Date,
    },

    notes: String,

    metadata: {
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
      estimatedPreparationTime: Number, // minutes
      actualPreparationTime: Number,
    },
  },
  { timestamps: true }
);

// Index pour les requêtes fréquentes
// Index composé : commandes actives par restaurant
commandeSchema.index({ status: 1, restaurant_id: 1 });

// Index composé : historique client trié par date
commandeSchema.index({ customer_id: 1, createdAt: -1 });

// Index : livraisons actives d'un livreur
commandeSchema.index({ deliverer_id: 1, status: 1 });

// Index géospatial sur le tracé GPS
commandeSchema.index({ 'deliveryTracking.coordinates': '2dsphere' });

module.exports = mongoose.model('Commande', commandeSchema);
