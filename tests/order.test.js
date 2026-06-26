const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDatabase, disconnectDatabase } = require('../src/config/database');
const User = require('../src/models/User');
const Commande = require('../src/models/Commande');
const Restaurant = require('../src/models/Restaurant');
const Deliverer = require('../src/models/Deliverer');

const testCustomer = {
  email: 'orderuser@example.com',
  password: 'password123',
  profile: {
    firstName: 'Order',
    lastName: 'User',
    phone: '+24187650000',
  },
};

const testVendor = {
  email: 'vendor@example.com',
  password: 'password123',
  profile: {
    firstName: 'Vendor',
    lastName: 'User',
    phone: '+24187650010',
  },
  role: 'VENDOR',
};

const testDeliverer = {
  email: 'deliverer@example.com',
  password: 'password123',
  profile: {
    firstName: 'Deliverer',
    lastName: 'Agent',
    phone: '+24187650001',
  },
  role: 'DELIVERER',
};

const testRestaurant = {
  name: 'Testaurant',
  email: 'testaurant@example.com',
  phone: '+24112340000',
  owner_id: null,
  address: {
    street: '123 Main St',
    district: 'PK5',
    city: 'Libreville',
    coordinates: { type: 'Point', coordinates: [9.45, 0.39] },
  },
  isOpen: true,
  menus: [
    {
      name: 'Menu Principal',
      dishes: [
        {
          name: 'Meal One',
          price: 1200,
          isAvailable: true,
          quantity: 1000,
        },
      ],
    },
  ],
};

let customerToken;
let vendorToken;
let restaurantId;
let orderId;
let customerId;
let vendorId;
let delivererUserId;
let delivererId;
let dishId;

describe('API Commandes', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({ email: testCustomer.email });
    await User.deleteMany({ email: testVendor.email });
    await User.deleteMany({ email: testDeliverer.email });
    await User.deleteMany({ email: 'deliverer2@example.com' });
    await User.deleteMany({ email: 'deliverer3@example.com' });
    await Restaurant.deleteMany({ name: testRestaurant.name });
    await Deliverer.deleteMany({});
    await Commande.deleteMany({});

    const customerRegister = await request(app).post('/api/auth/register').send(testCustomer);
    customerToken = customerRegister.body.token;
    customerId = customerRegister.body.user.id;

    const vendorRegister = await request(app).post('/api/auth/register').send(testVendor);
    vendorToken = vendorRegister.body.token;
    vendorId = vendorRegister.body.user.id;

    const delivererRegister = await request(app).post('/api/auth/register').send(testDeliverer);
    delivererUserId = delivererRegister.body.user.id;

    const restaurantPayload = {
      ...testRestaurant,
      owner_id: vendorId,
    };

    const restaurant = new Restaurant(restaurantPayload);
    await restaurant.save();
    restaurantId = restaurant._id.toString();
    dishId = restaurant.menus[0].dishes[0]._id.toString();

    const delivererPayload = {
      user_id: delivererUserId,
      personalInfo: {
        firstName: 'Deliverer',
        lastName: 'Agent',
        phone: '+24187650001',
        email: testDeliverer.email,
        idCardNumber: 'DELIV1234',
      },
      vehicleInfo: {
        type: 'MOTORCYCLE',
        licensePlate: 'DELIV-001',
      },
      currentLocation: {
        type: 'Point',
        coordinates: [0, 0],
      },
      isActive: true,
      isAvailable: true,
    };

    const deliverer = new Deliverer(delivererPayload);
    await deliverer.save();
    delivererId = deliverer._id.toString();

    const createOrderResponse = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        restaurantId,
        deliveryInfo: {
          address: { street: '456 Destination Ave', district: 'PK5', city: 'Libreville' },
          recipientName: 'Order User',
          recipientPhone: '+24187650000',
        },
        paymentMethod: 'CARD',
        items: [{ dishId, dishName: 'Meal One', quantity: 2, unitPrice: 1200 }],
      });

    orderId = createOrderResponse.body.order._id;
  });

  afterEach(async () => {
    await User.deleteMany({ email: testCustomer.email });
    await User.deleteMany({ email: testVendor.email });
    await User.deleteMany({ email: testDeliverer.email });
    await Restaurant.deleteMany({ name: testRestaurant.name });
    await Deliverer.deleteMany({});
    await Commande.deleteMany({});
  });

  test('POST /api/orders doit créer une commande si authentifié', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        restaurantId,
        deliveryInfo: {
          address: {
            street: '456 Destination Ave',
            district: 'PK5',
            city: 'Libreville',
          },
          recipientName: 'Order User',
          recipientPhone: '+24187650000',
          instructions: 'Leave at gate',
        },
        paymentMethod: 'CARD',
        items: [
          { dishId, dishName: 'Meal One', quantity: 2, unitPrice: 1200 },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.order).toHaveProperty('customer_id');
    expect(response.body.order).toHaveProperty('pricing');
    orderId = response.body.order._id;
    expect(orderId).toBeDefined();
  });

  test('GET /api/orders doit lister les commandes de l\'utilisateur', async () => {
    const response = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.orders)).toBe(true);
    expect(response.body.orders.length).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/orders/:id doit retourner la commande créée', async () => {
    const response = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.order).toHaveProperty('_id', orderId);
  });

  test('POST /api/orders doit retourner 401 sans token', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({
        restaurantId,
        deliveryInfo: {
          address: { street: '456 Destination Ave', district: 'PK5', city: 'Libreville' },
          recipientName: 'Order User',
          recipientPhone: '+24187650000',
        },
        paymentMethod: 'CARD',
        items: [{ dishId, dishName: 'Meal One', quantity: 2, unitPrice: 1200 }],
      });

    expect(response.status).toBe(401);
  });

  test('POST /api/orders doit retourner 404 pour un restaurant inexistant', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        restaurantId: new mongoose.Types.ObjectId().toString(),
        deliveryInfo: {
          address: { street: '456 Destination Ave', district: 'PK5', city: 'Libreville' },
          recipientName: 'Order User',
          recipientPhone: '+24187650000',
        },
        paymentMethod: 'CARD',
        items: [{ dishId, dishName: 'Meal One', quantity: 2, unitPrice: 1200 }],
      });

    expect(response.status).toBe(404);
  });

  test('GET /api/orders/:id doit retourner 404 pour une commande inexistante', async () => {
    const response = await request(app)
      .get(`/api/orders/${new mongoose.Types.ObjectId().toString()}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(response.status).toBe(404);
  });

  test('GET /api/orders/:id doit retourner 400 pour un ID invalide', async () => {
    const response = await request(app)
      .get('/api/orders/invalid-id')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(response.status).toBe(400);
  });

  test('POST /api/orders/:id/assign doit assigner un livreur disponible', async () => {
    const createResponse = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        restaurantId,
        deliveryInfo: {
          address: { street: '456 Destination Ave', district: 'PK5', city: 'Libreville' },
          recipientName: 'Order User',
          recipientPhone: '+24187650000',
        },
        paymentMethod: 'CARD',
        items: [{ dishId, dishName: 'Meal One', quantity: 2, unitPrice: 1200 }],
      });

    const createdOrderId = createResponse.body.order._id;

    const assignResponse = await request(app)
      .post(`/api/orders/${createdOrderId}/assign`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ delivererId });

    expect(assignResponse.status).toBe(200);
    expect(assignResponse.body.order).toHaveProperty('deliverer_id', delivererId);
  });

  test('POST /api/orders/:id/assign doit réaffecter un livreur différent', async () => {
    const createResponse = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        restaurantId,
        deliveryInfo: {
          address: { street: '456 Destination Ave', district: 'PK5', city: 'Libreville' },
          recipientName: 'Order User',
          recipientPhone: '+24187650000',
        },
        paymentMethod: 'CARD',
        items: [{ dishId, dishName: 'Meal One', quantity: 2, unitPrice: 1200 }],
      });

    const createdOrderId = createResponse.body.order._id;

    const secondDelivererRegister = await request(app).post('/api/auth/register').send({
      email: 'deliverer2@example.com',
      password: 'password123',
      profile: {
        firstName: 'Second',
        lastName: 'Deliverer',
        phone: '+24187650002',
      },
      role: 'DELIVERER',
    });

    expect(secondDelivererRegister.status).toBe(201);
    const secondDelivererUserId = secondDelivererRegister.body.user.id;

    const secondDeliverer = new Deliverer({
      user_id: secondDelivererUserId,
      personalInfo: {
        firstName: 'Second',
        lastName: 'Deliverer',
        phone: '+24187650002',
        email: 'deliverer2@example.com',
        idCardNumber: 'DELIV5678',
      },
      vehicleInfo: {
        type: 'MOTORCYCLE',
        licensePlate: 'DELIV-002',
      },
      currentLocation: {
        type: 'Point',
        coordinates: [0, 0],
      },
      isActive: true,
      isAvailable: true,
    });
    await secondDeliverer.save();

    await request(app)
      .post(`/api/orders/${createdOrderId}/assign`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ delivererId });

    const reassignResponse = await request(app)
      .post(`/api/orders/${createdOrderId}/assign`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ delivererId: secondDeliverer._id.toString() });

    expect(reassignResponse.status).toBe(200);
    expect(reassignResponse.body.order).toHaveProperty('deliverer_id', secondDeliverer._id.toString());
  });

  test('POST /api/orders/:id/assign doit retourner 400 si le livreur est indisponible', async () => {
    const unavailableDeliverer = new Deliverer({
      user_id: new mongoose.Types.ObjectId().toString(),
      personalInfo: {
        firstName: 'Unavailable',
        lastName: 'Rider',
        phone: '+24187650003',
        email: 'deliverer3@example.com',
        idCardNumber: 'DELIV9999',
      },
      vehicleInfo: {
        type: 'MOTORCYCLE',
        licensePlate: 'DELIV-003',
      },
      currentLocation: {
        type: 'Point',
        coordinates: [0, 0],
      },
      isActive: true,
      isAvailable: false,
    });
    await unavailableDeliverer.save();

    const createResponse = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        restaurantId,
        deliveryInfo: {
          address: { street: '456 Destination Ave', district: 'PK5', city: 'Libreville' },
          recipientName: 'Order User',
          recipientPhone: '+24187650000',
        },
        paymentMethod: 'CARD',
        items: [{ dishId, dishName: 'Meal One', quantity: 2, unitPrice: 1200 }],
      });

    const createdOrderId = createResponse.body.order._id;

    const assignResponse = await request(app)
      .post(`/api/orders/${createdOrderId}/assign`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ delivererId: unavailableDeliverer._id.toString() });

    expect(assignResponse.status).toBe(400);
  });
});
