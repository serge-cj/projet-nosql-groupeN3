const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "L'e-mail est obligatoire"],
      unique: true,
      lowercase: true,
      match: [/.+@.+\..+/, 'Veuillez fournir une adresse e-mail valide'],
    },

    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire'],
      minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
      select: false,
    },

    profile: {
      firstName: {
        type: String,
        required: [true, 'Le prénom est obligatoire'],
        minlength: 2,
      },
      lastName: {
        type: String,
        required: [true, 'Le nom est obligatoire'],
        minlength: 2,
      },
      phone: {
        type: String,
        required: [true, 'Le numéro de téléphone est obligatoire'],
        match: [/^\+241\d{8}$/, 'Format attendu : +241XXXXXXXX'],
      },
      avatar: {
        type: String,
        default: null,
      },
    },

    role: {
      type: String,
      enum: {
        values: ['CUSTOMER', 'VENDOR', 'DELIVERER', 'ADMIN'],
        message: 'Rôle invalide',
      },
      default: 'CUSTOMER',
    },

    addresses: [
      {
        label: {
          type: String,
          enum: ['HOME', 'WORK', 'OTHER'],
          default: 'HOME',
        },
        street: {
          type: String,
          required: true,
        },
        district: {
          type: String,
          required: true,
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
            default: 'Point',
          },
          coordinates: [Number], // nous stockons les coordonnées au format [longitude, latitude]
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    phoneVerified: {
      type: Boolean,
      default: false,
    },

    favoriteRestaurants: [mongoose.Schema.Types.ObjectId],
    favoriteDishes: [mongoose.Schema.Types.ObjectId],

    metadata: {
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
      lastLogin: Date,
    },
  },
  { timestamps: true }
);

// Nous créons un index géospatial afin de permettre les requêtes de proximité
userSchema.index({ 'addresses.coordinates': '2dsphere' });

// Nous hachons le mot de passe avant chaque enregistrement
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
    next();
  } catch (err) {
    next(err);
  }
});

// Nous définissons ici la méthode de comparaison du mot de passe
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// Nous définissons un champ virtuel pour le nom complet
userSchema.virtual('fullName').get(function () {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

module.exports = mongoose.model('User', userSchema);
