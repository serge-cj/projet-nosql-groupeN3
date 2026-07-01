const mongoose = require('mongoose');

const delivererSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    personalInfo: {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
        match: [/^\+241\d{8}$/, 'Format attendu : +241XXXXXXXX'],
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
      },
      idCardNumber: {
        type: String,
        required: true,
        unique: true,
      },
      idCardExpiry: Date,
    },

    vehicleInfo: {
      type: {
        type: String,
        enum: ['MOTORCYCLE', 'SCOOTER', 'BICYCLE', 'CAR'],
        required: true,
      },
      licensePlate: {
        type: String,
        required: true,
        unique: true,
      },
      color: String,
      insuranceExpiry: Date,
    },

    // Nous modélisons ici la position du livreur en temps réel. Nous ne mettons pas de
    // valeur par défaut sur `type` : tant qu'aucune position GPS n'a été envoyée, ce champ
    // doit rester absent (un sous-document { type: 'Point' } sans coordonnées casse l'index 2dsphere).
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: [Number], // nous stockons les coordonnées au format [longitude, latitude]
      lastUpdated: Date,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isAvailable: {
      type: Boolean,
      default: false,
    },

    performanceMetrics: {
      totalDeliveries: {
        type: Number,
        default: 0,
      },
      totalEarnings: {
        type: Number,
        default: 0,
      },
      averageRating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      ratingCount: {
        type: Number,
        default: 0,
      },
      cancelledDeliveries: {
        type: Number,
        default: 0,
      },
      averageDeliveryTime: {
        type: Number,
        default: 0,
      }, // nous exprimons cette durée en minutes
    },

    bankInfo: {
      accountHolder: String,
      bankName: String,
      accountNumber: String,
      iban: String,
    },

    documents: [
      {
        type: {
          type: String,
          enum: ['IDENTITY', 'INSURANCE', 'VEHICLE_REGISTRATION'],
        },
        url: String,
        verified: {
          type: Boolean,
          default: false,
        },
        verifiedAt: Date,
      },
    ],

    availability: {
      monday: {
        available: {
          type: Boolean,
          default: true,
        },
        startTime: String,
        endTime: String,
      },
      tuesday: {
        available: {
          type: Boolean,
          default: true,
        },
        startTime: String,
        endTime: String,
      },
      wednesday: {
        available: {
          type: Boolean,
          default: true,
        },
        startTime: String,
        endTime: String,
      },
      thursday: {
        available: {
          type: Boolean,
          default: true,
        },
        startTime: String,
        endTime: String,
      },
      friday: {
        available: {
          type: Boolean,
          default: true,
        },
        startTime: String,
        endTime: String,
      },
      saturday: {
        available: {
          type: Boolean,
          default: true,
        },
        startTime: String,
        endTime: String,
      },
      sunday: {
        available: {
          type: Boolean,
          default: false,
        },
        startTime: String,
        endTime: String,
      },
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
    },
  },
  { timestamps: true }
);

// Nous créons un index géospatial afin de localiser les livreurs à proximité
delivererSchema.index({ 'currentLocation': '2dsphere' });

// Nous créons un index afin d'identifier rapidement les livreurs disponibles
delivererSchema.index({ isAvailable: 1, isActive: 1 });

module.exports = mongoose.model('Deliverer', delivererSchema);
