const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDatabase, disconnectDatabase } = require('../src/config/database');
const User = require('../src/models/User');
const Restaurant = require('../src/models/Restaurant');

const vendorUser = () => ({
  email: `vendoruser+${Date.now()}@example.com`,
  password: 'password123',
  role: 'VENDOR',
  profile: {
    firstName: 'Vendor',
    lastName: 'User',
    phone: '+24187650123',
  },
});

const restaurantPayload = {
  name: 'Vendor Testaurant',
  phone: '+24112345678',
  address: {
    street: 'Rue de Test',
    district: 'PK5',
  },
  deliveryZones: [{ zone: 'PK5', deliveryFee: 500, deliveryTime: 25 }],
};

let token;
let restaurantId;
let menuId;
let dishId;
let registeredUserEmail;
let registeredUserId;

describe('API Restaurants', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    const user = vendorUser();
    registeredUserEmail = user.email;

    await User.deleteMany({ email: registeredUserEmail });
    await Restaurant.deleteMany({ name: restaurantPayload.name });

    const register = await request(app).post('/api/auth/register').send(user);
    token = register.body.token;
    registeredUserId = register.body.user.id;
  });

  afterEach(async () => {
    if (registeredUserEmail) {
      await User.deleteMany({ email: registeredUserEmail });
    }
    if (registeredUserId) {
      await Restaurant.deleteMany({ owner_id: registeredUserId });
    } else {
      await Restaurant.deleteMany({ name: restaurantPayload.name });
    }
    registeredUserEmail = null;
    registeredUserId = null;
  });

  test('POST /api/restaurants doit créer un restaurant pour un vendeur authentifié', async () => {
    const response = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${token}`)
      .send(restaurantPayload);

    expect(response.status).toBe(201);
    expect(response.body.restaurant).toHaveProperty('_id');
    expect(response.body.restaurant.name).toBe(restaurantPayload.name);
    expect(response.body.restaurant.address.street).toBe(restaurantPayload.address.street);

    restaurantId = response.body.restaurant._id;
  });

  test('GET /api/restaurants/me doit retourner les restaurants du vendeur', async () => {
    const createResponse = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${token}`)
      .send(restaurantPayload);

    restaurantId = createResponse.body.restaurant._id;

    const response = await request(app)
      .get('/api/restaurants/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.restaurants)).toBe(true);
    expect(response.body.restaurants.length).toBe(1);
    expect(response.body.restaurants[0]._id).toBe(restaurantId);
  });

  test('POST /api/restaurants/:id/menus doit créer un menu vide puis POST /dishes lève des plats persistés', async () => {
    const createRestaurantResponse = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${token}`)
      .send(restaurantPayload);

    restaurantId = createRestaurantResponse.body.restaurant._id;

    const createMenuResponse = await request(app)
      .post(`/api/restaurants/${restaurantId}/menus`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Menu Test', description: 'Menu de test' });

    expect(createMenuResponse.status).toBe(201);
    expect(createMenuResponse.body.menu).toHaveProperty('_id');
    expect(createMenuResponse.body.menu.name).toBe('Menu Test');
    expect(Array.isArray(createMenuResponse.body.menu.dishes)).toBe(true);
    expect(createMenuResponse.body.menu.dishes.length).toBe(0);

    menuId = createMenuResponse.body.menu._id;

    const addDishResponse = await request(app)
      .post(`/api/restaurants/${restaurantId}/menus/${menuId}/dishes`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Plat Test',
        price: 2500,
        category: 'Plats Principaux',
        isAvailable: true,
        preparationTime: 20,
      });

    expect(addDishResponse.status).toBe(201);
    expect(addDishResponse.body.dish).toHaveProperty('_id');
    expect(addDishResponse.body.dish.name).toBe('Plat Test');
    expect(addDishResponse.body.menu.dishes.length).toBe(1);

    dishId = addDishResponse.body.dish._id;

    const getMenusResponse = await request(app).get(`/api/restaurants/${restaurantId}/menus`);

    expect(getMenusResponse.status).toBe(200);
    expect(Array.isArray(getMenusResponse.body.menus)).toBe(true);
    expect(getMenusResponse.body.menus[0]._id).toBe(menuId);
    expect(getMenusResponse.body.menus[0].dishes[0]._id).toBe(dishId);
  });

  test('PATCH /api/restaurants/:id/menus/:menuId doit mettre à jour un menu', async () => {
    const createRestaurantResponse = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${token}`)
      .send(restaurantPayload);

    restaurantId = createRestaurantResponse.body.restaurant._id;

    const createMenuResponse = await request(app)
      .post(`/api/restaurants/${restaurantId}/menus`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Menu Test', description: 'Menu de test' });

    expect(createMenuResponse.status).toBe(201);
    menuId = createMenuResponse.body.menu._id;

    const updateMenuResponse = await request(app)
      .patch(`/api/restaurants/${restaurantId}/menus/${menuId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Menu Modifié', description: 'Description modifiée' });

    expect(updateMenuResponse.status).toBe(200);
    expect(updateMenuResponse.body.menu.name).toBe('Menu Modifié');
    expect(updateMenuResponse.body.menu.description).toBe('Description modifiée');
    expect(updateMenuResponse.body.restaurant.menus[0].name).toBe('Menu Modifié');
  });

  test('PATCH /api/restaurants/:id/menus/:menuId/dishes/:dishId doit mettre à jour un plat puis le supprimer', async () => {
    const createRestaurantResponse = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${token}`)
      .send(restaurantPayload);

    restaurantId = createRestaurantResponse.body.restaurant._id;

    const createMenuResponse = await request(app)
      .post(`/api/restaurants/${restaurantId}/menus`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Menu Test', description: 'Menu de test' });

    menuId = createMenuResponse.body.menu._id;

    const addDishResponse = await request(app)
      .post(`/api/restaurants/${restaurantId}/menus/${menuId}/dishes`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Plat Test',
        price: 2500,
        category: 'Plats Principaux',
        isAvailable: true,
        preparationTime: 20,
      });

    expect(addDishResponse.status).toBe(201);
    dishId = addDishResponse.body.dish._id;

    const updateDishResponse = await request(app)
      .patch(`/api/restaurants/${restaurantId}/menus/${menuId}/dishes/${dishId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Plat Test Modifié',
        price: 2800,
      });

    expect(updateDishResponse.status).toBe(200);
    expect(updateDishResponse.body.dish.name).toBe('Plat Test Modifié');
    expect(updateDishResponse.body.dish.price).toBe(2800);

    const deleteDishResponse = await request(app)
      .delete(`/api/restaurants/${restaurantId}/menus/${menuId}/dishes/${dishId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteDishResponse.status).toBe(204);

    const getMenusResponse = await request(app).get(`/api/restaurants/${restaurantId}/menus`);

    expect(getMenusResponse.status).toBe(200);
    expect(getMenusResponse.body.menus[0].dishes.length).toBe(0);
  });

  test('DELETE /api/restaurants/:id/menus/:menuId doit supprimer un menu', async () => {
    const createRestaurantResponse = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${token}`)
      .send(restaurantPayload);

    restaurantId = createRestaurantResponse.body.restaurant._id;

    const createMenuResponse = await request(app)
      .post(`/api/restaurants/${restaurantId}/menus`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Menu Test', description: 'Menu de test' });

    menuId = createMenuResponse.body.menu._id;

    const deleteMenuResponse = await request(app)
      .delete(`/api/restaurants/${restaurantId}/menus/${menuId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteMenuResponse.status).toBe(204);

    const getMenusResponse = await request(app).get(`/api/restaurants/${restaurantId}/menus`);

    expect(getMenusResponse.status).toBe(200);
    expect(getMenusResponse.body.menus.length).toBe(0);
  });
});
