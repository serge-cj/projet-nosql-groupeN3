const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    profile: z.object({
      firstName: z.string().min(2),
      lastName: z.string().min(2),
      phone: z.string().regex(/^\+241\d{8}$/),
      avatar: z.string().url().optional(),
    }),
    role: z.enum(['CUSTOMER', 'VENDOR', 'DELIVERER']).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
};
