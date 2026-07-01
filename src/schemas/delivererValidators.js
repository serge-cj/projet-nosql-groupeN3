const { z } = require('zod');

const updateDelivererLocationSchema = z.object({
  body: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
});

const createDelivererSchema = z.object({
  body: z.object({
    idCardNumber: z.string().min(1, "Le numéro de carte d'identité est requis"),
    idCardExpiry: z.string().optional(),
    vehicleType: z.enum(['MOTORCYCLE', 'SCOOTER', 'BICYCLE', 'CAR']),
    licensePlate: z.string().min(1, "La plaque d'immatriculation est requise"),
    color: z.string().optional(),
  }),
});

module.exports = {
  updateDelivererLocationSchema,
  createDelivererSchema,
};
