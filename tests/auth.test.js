const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDatabase, disconnectDatabase } = require('../src/config/database');
const User = require('../src/models/User');

const testUser = {
  email: 'testuser@example.com',
  password: 'password123',
  profile: {
    firstName: 'Test',
    lastName: 'User',
    phone: '+24112345678',
  },
};

describe('API Authentification', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({ email: testUser.email });
  });

  afterEach(async () => {
    await User.deleteMany({ email: testUser.email });
  });

  test('POST /api/auth/register doit créer un utilisateur et retourner un jeton', async () => {
    const response = await request(app).post('/api/auth/register').send(testUser);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toMatchObject({
      email: testUser.email,
      role: expect.any(String),
      profile: {
        firstName: testUser.profile.firstName,
        lastName: testUser.profile.lastName,
        phone: testUser.profile.phone,
      },
    });
    expect(response.body).toHaveProperty('token');
  });

  test('POST /api/auth/login doit authentifier et retourner un jeton', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toMatchObject({ email: testUser.email });
  });

  test('POST /api/auth/register doit retourner 409 pour un email déjà utilisé', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const response = await request(app).post('/api/auth/register').send(testUser);

    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('error');
  });

  test('POST /api/auth/login doit retourner 401 pour des identifiants invalides', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  test('POST /api/auth/register doit retourner 400 pour des données invalides', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'invalid-email',
      password: 'short',
      profile: { firstName: 'Test', lastName: 'User', phone: '+24112345678' },
    });

    expect(response.status).toBe(400);
  });
});
