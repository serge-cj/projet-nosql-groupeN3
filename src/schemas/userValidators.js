const { z } = require('zod');

const updateProfileSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    profile: z.object({
      firstName: z.string().min(2).optional(),
      lastName: z.string().min(2).optional(),
      phone: z.string().regex(/^\+241\d{8}$/).optional(),
      avatar: z.string().url().optional(),
    }).optional(),
    addresses: z.array(
      z.object({
        label: z.enum(['HOME', 'WORK', 'OTHER']).optional(),
        street: z.string().optional(),
        district: z.string().optional(),
        city: z.string().optional(),
        zipCode: z.string().optional(),
        coordinates: z.object({
          type: z.literal('Point'),
          coordinates: z.tuple([z.number(), z.number()]),
        }).optional(),
        isDefault: z.boolean().optional(),
      }),
    ).optional(),
  }),
});

module.exports = {
  updateProfileSchema,
};
