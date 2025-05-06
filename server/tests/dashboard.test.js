import request from 'supertest';
import app from '../src/app.js';
import {
  createManyTestRoles,
  createManyTestProperties,
  createManyTestUsers,
  removeAllTestRoles,
  removeAllTestProperties,
  removeAllTestUsers,
} from './testUtil.js';

describe('GET /api/dashboard', () => {
  beforeEach(async () => {
    await createManyTestRoles();
    await createManyTestProperties();
    await createManyTestUsers();
  });

  afterEach(async () => {
    await removeAllTestRoles();
    await removeAllTestProperties();
    await removeAllTestUsers();
  });

  it('should return an error if user does not have permission', async () => {
    const result = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${global.userToken}`);

    expect(result.status).toBe(403);
    expect(result.body.message).toBe('Permission denied');
  });

  it('should return dashboard statistics data', async () => {
    const result = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${global.adminToken}`);

    expect(result.status).toBe(200);
    expect(result.body.message).toBe('Statistics data retrieved successfully');
    expect(result.body.data.totalProperties).toBe(15);
    expect(result.body.data.totalRoles).toBeGreaterThanOrEqual(15);
    expect(result.body.data.totalUsers).toBeGreaterThanOrEqual(15);
    expect(result.body.data.recentProperties).toHaveLength(5);
  });
});
