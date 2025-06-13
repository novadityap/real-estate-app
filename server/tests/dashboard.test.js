import request from 'supertest';
import app from '../src/app.js';
import {
  createAccessToken,
  createTestRole,
  createTestUser,
  createManyTestRoles,
  createManyTestProperties,
  createManyTestUsers,
  removeAllTestRoles,
  removeAllTestProperties,
  removeAllTestUsers,
} from './testUtil.js';

describe('GET /api/dashboard', () => {
  afterEach(async () => {
    await removeAllTestProperties();
    await removeAllTestUsers();
    await removeAllTestRoles();
  });

  it('should return an error if user does not have permission', async () => {
    await createTestUser('user');
    await createAccessToken();

    const result = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(403);
    expect(result.body.message).toBe('Permission denied');
  });

  it('should return dashboard statistics data', async () => {
    await createTestRole();
    await createTestUser('admin');
    await createAccessToken('access');
    await createManyTestRoles();
    await createManyTestProperties();
    await createManyTestUsers();

    const result = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(200);
    expect(result.body.message).toBe('Statistics data retrieved successfully');
    expect(result.body.data.totalProperties).toBe(15);
    expect(result.body.data.totalRoles).toBeGreaterThanOrEqual(15);
    expect(result.body.data.totalUsers).toBeGreaterThanOrEqual(15);
    expect(result.body.data.recentProperties).toHaveLength(5);
  });
});
