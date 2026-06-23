const { z } = require('zod');

const orderItemSchema = z.object({
  dishId: z.string().min(1),
  dishName: z.string().min(1),
  unitPrice: z.number().positive(),
  quantity: z.number().int().positive(),
});

const placeOrderSchema = z.object({
  body: z.object({
    restaurantId: z.string().min(1),
    deliveryInfo: z.object({
      address: z.object({
        street: z.string(),
        district: z.string(),
        city: z.string().optional(),
        notes: z.string().optional(),
      }),
      recipientName: z.string(),
      recipientPhone: z.string().regex(/^\+241\d{8}$/),
      estimatedDeliveryTime: z.string().optional(),
    }),
    paymentMethod: z.enum(['CASH', 'CARD', 'MOBILE_MONEY']),
    items: z.array(orderItemSchema).nonempty(),
  }),
});

const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      'PENDING',
      'CONFIRMED',
      'PREPARING',
      'READY_FOR_DELIVERY',
      'DELIVERY_IN_PROGRESS',
      'DELIVERED',
      'CANCELLED',
      'FAILED',
    ]),
    note: z.string().optional(),
  }),
});

const assignDelivererSchema = z.object({
  body: z.object({
    delivererId: z.string().min(1),
  }),
});

module.exports = {
  placeOrderSchema,
  updateOrderStatusSchema,
  assignDelivererSchema,
};
