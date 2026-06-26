const mongoose = require('mongoose');

// Nous définissons ici la machine à états des statuts de commande
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
    // Nous référençons ici les entités liées à la commande
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

    // Nous conservons ici les articles commandés sous forme de snapshot figé
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

    // Nous détaillons ici les éléments de prix
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

    // Nous stockons ici le statut courant de la machine à états
    status: {
      type: String,
      enum: Object.values(ORDER_STATUSES),
      default: ORDER_STATUSES.PENDING,
    },

    // Nous conservons ici l'historique des transitions de statut
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

    // Nous modélisons ici le suivi GPS du livreur sous forme de série temporelle
    deliveryTracking: [
      {
        timestamp: Date,
        coordinates: {
          type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
          },
          coordinates: [Number], // nous stockons les coordonnées au format [longitude, latitude]
        },
        speed: Number, // nous exprimons cette vitesse en km/h
        distance: Number, // nous exprimons cette distance en km depuis le restaurant
      },
    ],

    // Nous regroupons ici les informations de livraison
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

    // Nous regroupons ici les informations de paiement
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
      estimatedPreparationTime: Number, // nous exprimons cette durée en minutes
      actualPreparationTime: Number,
    },
  },
  { timestamps: true }
);

// Nous créons ici les index nécessaires aux requêtes fréquentes
// Nous créons un index composé afin de retrouver les commandes actives par restaurant
commandeSchema.index({ status: 1, restaurant_id: 1 });

// Nous créons un index composé afin de trier l'historique client par date
commandeSchema.index({ customer_id: 1, createdAt: -1 });

// Nous créons un index afin de retrouver les livraisons actives d'un livreur
commandeSchema.index({ deliverer_id: 1, status: 1 });

// Nous créons un index géospatial sur le tracé GPS
commandeSchema.index({ 'deliveryTracking.coordinates': '2dsphere' });

module.exports = mongoose.model('Commande', commandeSchema);
