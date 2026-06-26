const { z } = require('zod');

const dishSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive('Le prix doit être positif'),
  currency: z.string().default('FCFA'),
  category: z.enum([
    'Plats Principaux',
    'Accompagnements',
    'Desserts',
    'Boissons',
    'Entrées',
  ]),
  isAvailable: z.boolean().default(true),
  quantity: z.number().int().min(0).default(0),
  image: z.string().url().optional(),
  preparationTime: z.number().int().min(5).default(15), // minutes
});

const menuSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  dishes: z.array(dishSchema).min(1, 'Un menu doit contenir au moins un plat'),
});

const updateDishSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    price: z.number().positive('Le prix doit être positif').optional(),
    currency: z.string().optional(),
    category: z.enum([
      'Plats Principaux',
      'Accompagnements',
      'Desserts',
      'Boissons',
      'Entrées',
    ]).optional(),
    isAvailable: z.boolean().optional(),
    quantity: z.number().int().min(0).optional(),
    image: z.string().url().optional(),
    preparationTime: z.number().int().min(5).optional(),
  }).strict(),
});

const createMenuSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    dishes: z.array(dishSchema).default([]),
  }).strict(),
});

const createRestaurantSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    phone: z.string().regex(/^\+241\d{8}$/, 'Format attendu : +241XXXXXXXX'),
    address: z.object({
      street: z.string().min(1),
      district: z.enum([
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
      ]),
    }).strict(),
    deliveryZones: z.array(
      z.object({
        zone: z.string().min(1),
        deliveryFee: z.number().optional(),
        deliveryTime: z.number().optional(),
      }).strict()
    ).optional(),
  }).strict(),
});

const updateMenuSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    dishes: z.array(dishSchema).optional(),
  }).strict(),
});

const createDishSchema = z.object({
  body: dishSchema.strict(),
});

const addDishToMenuSchema = z.object({
  body: dishSchema.strict(),
});

module.exports = {
  dishSchema,
  menuSchema,
  updateDishSchema,
  createMenuSchema,
  createRestaurantSchema,
  updateMenuSchema,
  createDishSchema,
  addDishToMenuSchema,
};
