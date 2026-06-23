const { z } = require('zod');

const updateDelivererLocationSchema = z.object({
  body: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
});

module.exports = {
  updateDelivererLocationSchema,
};
