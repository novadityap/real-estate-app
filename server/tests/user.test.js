import request from 'supertest';
import app from '../src/app.js';
import {
  createAccessToken,
  createTestRole,
  getTestRole,
  removeAllTestRoles,
  createTestUser,
  createManyTestUsers,
  removeAllTestUsers,
  updateTestUser,
  getTestUser,
  removeTestFile,
  checkFileExists,
} from './testUtil.js';
import cloudinary from '../src/utils/cloudinary.js';

describe('GET /api/users/search', () => {
  beforeEach(async () => {
    await createTestUser();
    await createAccessToken();
    await createManyTestUsers();
  });

  afterEach(async () => {
    await removeAllTestUsers();
  });

  it('should return an error if user does not have permission', async () => {
    const role = await getTestRole('user');

    await updateTestUser({
      roleId: role.id,
    });
    await createAccessToken();

    const result = await request(app)
      .get('/api/users/search')
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(403);
    expect(result.body.message).toBe('Permission denied');
  });

  it('should return a list of users with default pagination', async () => {
    const result = await request(app)
      .get('/api/users/search')
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(200);
    expect(result.body.message).toBe('Users retrieved successfully');
    expect(result.body.data).toHaveLength(10);
    expect(result.body.meta.pageSize).toBe(10);
    expect(result.body.meta.totalItems).toBeGreaterThanOrEqual(15);
    expect(result.body.meta.currentPage).toBe(1);
    expect(result.body.meta.totalPages).toBe(2);
  });

  it('should return a list of users with custom pagination', async () => {
    const result = await request(app)
      .get('/api/users/search')
      .set('Authorization', `Bearer ${global.accessToken}`)
      .query({
        page: 2,
      });

    expect(result.status).toBe(200);
    expect(result.body.message).toBe('Users retrieved successfully');
    expect(result.body.data.length).toBeGreaterThanOrEqual(5);
    expect(result.body.meta.pageSize).toBe(10);
    expect(result.body.meta.totalItems).toBeGreaterThanOrEqual(15);
    expect(result.body.meta.currentPage).toBe(2);
    expect(result.body.meta.totalPages).toBe(2);
  });

  it('should return a list of users with custom search', async () => {
    const result = await request(app)
      .get('/api/users/search')
      .set('Authorization', `Bearer ${global.accessToken}`)
      .query({
        q: 'test10',
      });

    expect(result.status).toBe(200);
    expect(result.body.message).toBe('Users retrieved successfully');
    expect(result.body.data).toHaveLength(1);
    expect(result.body.meta.pageSize).toBe(10);
    expect(result.body.meta.totalItems).toBe(1);
    expect(result.body.meta.currentPage).toBe(1);
    expect(result.body.meta.totalPages).toBe(1);
  });
});

describe('GET /api/users/:userId', () => {
  beforeEach(async () => {
    await createTestUser();
    await createAccessToken();
  });

  afterEach(async () => {
    await removeAllTestUsers();
  });

  it('should return an error if user is not owned by current user', async () => {
    const role = await getTestRole('user');
    const otherUser = await createTestUser({
      username: 'test1',
      email: 'test1@me.com',
      roleId: role.id,
    });

    await updateTestUser({ roleId: role.id });
    await createAccessToken();

    const result = await request(app)
      .get(`/api/users/${otherUser.id}`)
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(403);
    expect(result.body.message).toBe('Permission denied');
  });

  it('should return an error if user id is invalid', async () => {
    const result = await request(app)
      .get('/api/users/invalid-id')
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(400);
    expect(result.body.message).toBe('Validation errors');
    expect(result.body.errors.userId).toBeDefined();
  });

  it('should return an error if user is not found', async () => {
    const result = await request(app)
      .get(`/api/users/${global.validUUID}`)
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(404);
    expect(result.body.message).toBe('User not found');
  });

  it('should return a user for user id is valid', async () => {
    const user = await getTestUser();
    const result = await request(app)
      .get(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(200);
    expect(result.body.message).toBe('User retrieved successfully');
    expect(result.body.data).toBeDefined();
  });
});

describe('POST /api/users', () => {
  beforeEach(async () => {
    await createTestUser();
    await createAccessToken();
  });

  afterEach(async () => {
    await removeAllTestUsers();
  });

  it('should return an error if user does not have permission', async () => {
    const role = await getTestRole('user');

    await updateTestUser({
      roleId: role.id,
    });
    await createAccessToken();

    const result = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${global.accessToken}`)
      .send({
        username: 'test1',
        email: 'test1@me.com',
        password: 'password',
        roleId: role.id,
      });

    expect(result.status).toBe(403);
    expect(result.body.message).toBe('Permission denied');
  });

  it('should return an error if input data is invalid', async () => {
    const result = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${global.accessToken}`)
      .send({
        username: '',
        email: '',
        password: '',
        roleId: '',
      });

    expect(result.status).toBe(400);
    expect(result.body.message).toBe('Validation errors');
    expect(result.body.errors.username).toBeDefined();
    expect(result.body.errors.email).toBeDefined();
    expect(result.body.errors.password).toBeDefined();
    expect(result.body.errors.roleId).toBeDefined();
  });

  it('should return an error if email already in use', async () => {
    await createTestUser({
      username: 'test1',
      email: 'test1@me.com',
    });

    const role = await getTestRole('admin');
    const result = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${global.accessToken}`)
      .send({
        username: 'test1',
        email: 'test@me.com',
        password: 'test123',
        roleId: role.id,
      });

    expect(result.status).toBe(409);
    expect(result.body.message).toBe('Resource already in use');
    expect(result.body.errors.email).toBeDefined();
  });

  it('should return an error if username already in use', async () => {
    await createTestUser({
      username: 'test1',
      email: 'test1@me.com',
    });

    const role = await getTestRole('admin');
    const result = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${global.accessToken}`)
      .send({
        username: 'test',
        email: 'test1@me.com',
        password: 'test123',
        roleId: role.id,
      });

    expect(result.status).toBe(409);
    expect(result.body.message).toBe('Resource already in use');
    expect(result.body.errors.username).toBeDefined();
  });

  it('should return an error if role is invalid', async () => {
    const result = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${global.accessToken}`)
      .send({
        username: 'test',
        email: 'test@me.com',
        password: 'test123',
        roleId: 'invalid-id',
      });

    expect(result.status).toBe(400);
    expect(result.body.message).toBe('Validation errors');
    expect(result.body.errors.roleId).toBeDefined();
  });

  it('should create a user if input data is valid', async () => {
    const role = await getTestRole('admin');
    const result = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${global.accessToken}`)
      .send({
        username: 'test1',
        email: 'test1@me.com',
        password: 'test123',
        roleId: role.id,
      });

    expect(result.status).toBe(201);
    expect(result.body.message).toBe('User created successfully');
  });
});

describe('PATCH /api/users/:userId/profile', () => {
  beforeEach(async () => {
    await createTestUser();
    await createAccessToken();
  });

  afterEach(async () => {
    await removeAllTestUsers();
  });

  it('should return an error if user is not owned by current user', async () => {
    const role = await getTestRole('user');
    const otherUser = await createTestUser({
      username: 'test1',
      email: 'test1@me.com',
      roleId: role.id,
    });

    await updateTestUser({ roleId: role.id });
    await createAccessToken();

    const result = await request(app)
      .patch(`/api/users/${otherUser.id}/profile`)
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(403);
    expect(result.body.message).toBe('Permission denied');
  });

  it('should return an error if user id is invalid', async () => {
    const result = await request(app)
      .patch('/api/users/invalid-id')
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(400);
    expect(result.body.message).toBe('Validation errors');
    expect(result.body.errors.userId).toBeDefined();
  });

  it('should return an error if user is not found', async () => {
    const result = await request(app)
      .patch(`/api/users/${global.validUUID}/profile`)
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(404);
    expect(result.body.message).toBe('User not found');
  });

  it('should return an error if input data is invalid', async () => {
    const user = await getTestUser();
    const result = await request(app)
      .patch(`/api/users/${user.id}/profile`)
      .set('Authorization', `Bearer ${global.accessToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('email', '')
      .field('username', '');

    expect(result.status).toBe(400);
    expect(result.body.message).toBe('Validation errors');
    expect(result.body.errors.username).toBeDefined();
    expect(result.body.errors.email).toBeDefined();
  });

  it('should return an error if email is already in use', async () => {
    await createTestUser({
      username: 'test1',
      email: 'test1@me.com',
    });

    const user = await getTestUser();
    const result = await request(app)
      .patch(`/api/users/${user.id}/profile`)
      .set('Authorization', `Bearer ${global.accessToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('email', 'test1@me.com');

    expect(result.status).toBe(409);
    expect(result.body.message).toBe('Resource already in use');
    expect(result.body.errors.email).toBeDefined();
  });

  it('should return an error if username is already in use', async () => {
    await createTestUser({
      username: 'test1',
      email: 'test1@me.com',
    });

    const user = await getTestUser();
    const result = await request(app)
      .patch(`/api/users/${user.id}/profile`)
      .set('Authorization', `Bearer ${global.accessToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('username', 'test1');

    expect(result.status).toBe(409);
    expect(result.body.message).toBe('Resource already in use');
    expect(result.body.errors.username).toBeDefined();
  });

  it('should update profile without changing avatar', async () => {
    const user = await getTestUser();
    const result = await request(app)
      .patch(`/api/users/${user.id}/profile`)
      .set('Authorization', `Bearer ${global.accessToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('email', 'test1@me.com')
      .field('username', 'test1');

    expect(result.status).toBe(200);
    expect(result.body.message).toBe('Profile updated successfully');
    expect(result.body.data.email).toBe('test1@me.com');
    expect(result.body.data.username).toBe('test1');
  });

  it('should update profile with changing avatar', async () => {
    const user = await getTestUser();
    const result = await request(app)
      .patch(`/api/users/${user.id}/profile`)
      .set('Authorization', `Bearer ${global.accessToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('email', 'test1@me.com')
      .field('username', 'test1')
      .attach('avatar', global.testAvatarPath);

    const updatedUser = await getTestUser(result.body.data.username);
    const avatarExists = await checkFileExists(updatedUser.avatar);

    expect(result.status).toBe(200);
    expect(result.body.message).toBe('Profile updated successfully');
    expect(result.body.data.email).toBe('test1@me.com');
    expect(result.body.data.username).toBe('test1');
    expect(avatarExists).toBe(true);

    await removeTestFile(updatedUser.avatar);
  });
});

describe('PATCH /api/users/:userId', () => {
  beforeEach(async () => {
    await createTestUser();
    await createAccessToken();
  });

  afterEach(async () => {
    await removeAllTestUsers();
  });

  it('should return an error if user is not owned by current user', async () => {
    const role = await getTestRole('user');
    const otherUser = await createTestUser({
      username: 'test1',
      email: 'test1@me.com',
      roleId: role.id,
    });

    await updateTestUser({ roleId: role.id });
    await createAccessToken();

    const result = await request(app)
      .patch(`/api/users/${otherUser.id}`)
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(403);
    expect(result.body.message).toBe('Permission denied');
  });

  it('should return an error if user id is invalid', async () => {
    const result = await request(app)
      .patch('/api/users/invalid-id')
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(400);
    expect(result.body.message).toBe('Validation errors');
    expect(result.body.errors.userId).toBeDefined();
  });

  it('should return an error if user is not found', async () => {
    const result = await request(app)
      .patch(`/api/users/${global.validUUID}`)
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(404);
    expect(result.body.message).toBe('User not found');
  });

  it('should return an error if input data is invalid', async () => {
    const user = await getTestUser();
    const result = await request(app)
      .patch(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${global.accessToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('email', '')
      .field('username', '');

    expect(result.status).toBe(400);
    expect(result.body.message).toBe('Validation errors');
    expect(result.body.errors.username).toBeDefined();
    expect(result.body.errors.email).toBeDefined();
  });

  it('should return an error if role is invalid', async () => {
    const user = await getTestUser();
    const result = await request(app)
      .patch(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${global.accessToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('email', 'test1@me.com')
      .field('username', 'test1')
      .field('roleId', 'invalid-id');

    expect(result.status).toBe(400);
    expect(result.body.message).toBe('Validation errors');
    expect(result.body.errors.roleId).toBeDefined();
  });

  it('should return an error if email is already in use', async () => {
    await createTestUser({
      username: 'test1',
      email: 'test1@me.com',
    });

    const role = await getTestRole('admin');
    const user = await getTestUser();
    const result = await request(app)
      .patch(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${global.accessToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('email', 'test1@me.com')
      .field('roleId', role.id);

    expect(result.status).toBe(409);
    expect(result.body.message).toBe('Resource already in use');
    expect(result.body.errors.email).toBeDefined();
  });

  it('should return an error if username is already in use', async () => {
    await createTestUser({
      username: 'test1',
      email: 'test1@me.com',
    });

    const role = await getTestRole('admin');
    const user = await getTestUser();
    const result = await request(app)
      .patch(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${global.accessToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('email', 'test1@me.com')
      .field('username', 'test1')
      .field('roleId', role.id);

    expect(result.status).toBe(409);
    expect(result.body.message).toBe('Resource already in use');
    expect(result.body.errors.username).toBeDefined();
  });

  it('should update user without changing avatar', async () => {
    const role = await getTestRole('admin');
    const user = await getTestUser();
    const result = await request(app)
      .patch(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${global.accessToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('email', 'test1@me.com')
      .field('username', 'test1')
      .field('roleId', role.id);

    expect(result.status).toBe(200);
    expect(result.body.message).toBe('User updated successfully');
    expect(result.body.data.email).toBe('test1@me.com');
    expect(result.body.data.username).toBe('test1');
    expect(result.body.data.roleId).toBe(role.id);
  });

  it('should update user with changing avatar', async () => {
    const user = await getTestUser();
    const result = await request(app)
      .patch(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${global.accessToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('email', 'test1@me.com')
      .field('username', 'test1')
      .attach('avatar', global.testAvatarPath);

    const updatedUser = await getTestUser(result.body.data.username);
    const avatarExists = await checkFileExists(updatedUser.avatar);

    expect(result.status).toBe(200);
    expect(result.body.message).toBe('User updated successfully');
    expect(result.body.data.email).toBe('test1@me.com');
    expect(result.body.data.username).toBe('test1');
    expect(avatarExists).toBe(true);

    await removeTestFile(updatedUser.avatar);
  });
});

describe('DELETE /api/users/:userId', () => {
  beforeEach(async () => {
    await createTestUser();
    await createAccessToken();
  });

  afterEach(async () => {
    await removeAllTestUsers();
  });

  it('should return an error if user is not owned by current user', async () => {
    const role = await getTestRole('user');
    const otherUser = await createTestUser({
      username: 'test1',
      email: 'test1@me.com',
      roleId: role.id,
    });

    await updateTestUser({ roleId: role.id });
    await createAccessToken();

    const result = await request(app)
      .delete(`/api/users/${otherUser.id}`)
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(403);
    expect(result.body.message).toBe('Permission denied');
  });

  it('should return an error if user id is invalid', async () => {
    const result = await request(app)
      .delete('/api/users/invalid-id')
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(400);
    expect(result.body.message).toBe('Validation errors');
    expect(result.body.errors.userId).toBeDefined();
  });

  it('should return an error if user is not found', async () => {
    const result = await request(app)
      .delete(`/api/users/${global.validUUID}`)
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(404);
    expect(result.body.message).toBe('User not found');
  });

  it('should delete user without removing default avatar', async () => {
    const user = await getTestUser();
    const result = await request(app)
      .delete(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${global.accessToken}`);

    const avatarExists = await checkFileExists(process.env.DEFAULT_AVATAR_URL);

    expect(result.status).toBe(200);
    expect(result.body.message).toBe('User deleted successfully');
    expect(avatarExists).toBe(true);
  });

  it('should delete user with removing avatar', async () => {
    const user = await getTestUser();
    const uploadResult = await cloudinary.uploader.upload(
      global.testAvatarPath,
      {
        folder: 'avatars',
      }
    );

    const updatedUser = await updateTestUser({
      avatar: uploadResult.secure_url,
    });
    const result = await request(app)
      .delete(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${global.accessToken}`);

    const avatarExists = await checkFileExists(updatedUser.avatar);

    expect(result.status).toBe(200);
    expect(result.body.message).toBe('User deleted successfully');
    expect(avatarExists).toBe(false);
  });
});
