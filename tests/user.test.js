const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { connectDatabase, disconnectDatabase } = require('../src/config/database');
const User = require('../src/models/User');

const testUser = {
  email: 'profileuser@example.com',
  password: 'password123',
  profile: {
    firstName: 'Profile',
    lastName: 'User',
    phone: '+24187654321',
  },
};

let token;

describe('API Utilisateur', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({ email: testUser.email });
    const register = await request(app).post('/api/auth/register').send(testUser);
    token = register.body.token;
  });

  afterEach(async () => {
    await User.deleteMany({ email: testUser.email });
  });

  test('GET /api/users/profile doit retourner le profil authentifié', async () => {
    const response = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ email: testUser.email });
  });

  test('PUT /api/users/profile doit mettre à jour le profil', async () => {
    const response = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ profile: { firstName: 'Updated' } });

    expect(response.status).toBe(200);
    expect(response.body.user.profile.firstName).toBe('Updated');
  });

  test('GET /api/users/profile doit retourner 401 sans token', async () => {
    const response = await request(app).get('/api/users/profile');

    expect(response.status).toBe(401);
  });

  test('GET /api/users/profile doit retourner 401 avec un token invalide', async () => {
    const response = await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
  });
});
