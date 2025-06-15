import request from 'supertest';
import app from '../src/app.js';
import {
  updateTestUser,
  getTestRole,
  removeAllTestRoles,
  createTestProperty,
  createManyTestProperties,
  removeAllTestProperties,
  updateTestProperty,
  getTestProperty,
  createTestUser,
  getTestUser,
  removeAllTestUsers,
  removeTestFile,
  checkFileExists,
  createAccessToken,
} from './testUtil.js';
import cloudinary from '../src/utils/cloudinary.js';

describe('GET /api/properties/search', () => {
  beforeEach(async () => {
    await createTestUser();
    await createAccessToken();
    await createManyTestProperties();
  });

  afterEach(async () => {
    await removeAllTestProperties();
    await removeAllTestUsers();
  });

  it('should return a list of properties with default pagination', async () => {
    const result = await request(app)
      .get('/api/properties/search')
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(200);
    expect(result.body.message).toBe('Properties retrieved successfully');
    expect(result.body.data).toHaveLength(10);
    expect(result.body.meta.pageSize).toBe(10);
    expect(result.body.meta.totalItems).toBe(15);
    expect(result.body.meta.currentPage).toBe(1);
    expect(result.body.meta.totalPages).toBe(2);
  });

  it('should return a list of properties with custom pagination', async () => {
    const result = await request(app)
      .get('/api/properties/search')
      .set('Authorization', `Bearer ${global.accessToken}`)
      .query({
        page: 2,
      });

    expect(result.status).toBe(200);
    expect(result.body.message).toBe('Properties retrieved successfully');
    expect(result.body.data.length).toBe(5);
    expect(result.body.meta.pageSize).toBe(10);
    expect(result.body.meta.totalItems).toBe(15);
    expect(result.body.meta.currentPage).toBe(2);
    expect(result.body.meta.totalPages).toBe(2);
  });

  it('should return a list of properties with custom search', async () => {
    const result = await request(app)
      .get('/api/properties/search')
      .set('Authorization', `Bearer ${global.accessToken}`)
      .query({
        q: 'test10',
      });

    expect(result.status).toBe(200);
    expect(result.body.message).toBe('Properties retrieved successfully');
    expect(result.body.data).toHaveLength(1);
    expect(result.body.meta.pageSize).toBe(10);
    expect(result.body.meta.totalItems).toBe(1);
    expect(result.body.meta.currentPage).toBe(1);
    expect(result.body.meta.totalPages).toBe(1);
  });
});

describe('GET /api/properties/:propertyId', () => {
  beforeEach(async () => {
    await createTestUser();
    await createAccessToken();
  });

  afterEach(async () => {
    await removeAllTestProperties();
    await removeAllTestUsers();
  });

  it('should return an error if property id is invalid', async () => {
    const result = await request(app)
      .get('/api/properties/invalid-id')
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(400);
    expect(result.body.message).toBe('Validation errors');
    expect(result.body.errors.propertyId).toBeDefined();
  });

  it('should return an error if property is not found', async () => {
    const result = await request(app)
      .get(`/api/properties/${global.validUUID}`)
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(404);
    expect(result.body.message).toBe('Property not found');
  });

  it('should return a user for property id is valid', async () => {
    const property = await createTestProperty();
    const result = await request(app)
      .get(`/api/properties/${property.id}`)
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(200);
    expect(result.body.message).toBe('Property retrieved successfully');
    expect(result.body.data).toBeDefined();
  });
});

describe('POST /api/properties', () => {
  beforeEach(async () => {
    await createTestUser();
    await createAccessToken();
  });

  afterEach(async () => {
    await removeAllTestProperties();
    await removeAllTestUsers();
    await removeAllTestRoles();
  });

  it('should return an error if input data is invalid', async () => {
    const result = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${global.accessToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('name', '')
      .field('description', '')
      .field('address', '')
      .field('regularPrice', '')
      .field('discountPrice', '')
      .field('bathroom', '')
      .field('bedroom', '')
      .field('parking', '')
      .field('furnished', '')
      .field('offer', '')
      .field('type', '');

    expect(result.status).toBe(400);
    expect(result.body.message).toBe('Validation errors');
    expect(result.body.errors.name).toBeDefined();
    expect(result.body.errors.description).toBeDefined();
    expect(result.body.errors.address).toBeDefined();
    expect(result.body.errors.regularPrice).toBeDefined();
    expect(result.body.errors.discountPrice).toBeDefined();
    expect(result.body.errors.bathroom).toBeDefined();
    expect(result.body.errors.bedroom).toBeDefined();
    expect(result.body.errors.parking).toBeDefined();
    expect(result.body.errors.furnished).toBeDefined();
    expect(result.body.errors.offer).toBeDefined();
    expect(result.body.errors.type).toBeDefined();
  });

  it('should create a property if input data is valid', async () => {
    const result = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${global.accessToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('name', 'test')
      .field('description', 'test')
      .field('address', 'test')
      .field('regularPrice', 130.0)
      .field('discountPrice', 100.0)
      .field('bathroom', 1)
      .field('bedroom', 2)
      .field('parking', true)
      .field('furnished', false)
      .field('offer', true)
      .field('type', 'sale')
      .attach('images', global.testPropertyImagePath);

    expect(result.status).toBe(201);
    expect(result.body.message).toBe('Property created successfully');

    const property = await getTestProperty();

    await removeTestFile(property.images);
  });
});

describe('PATCH /api/properties/:propertyId', () => {
  beforeEach(async () => {
    await createTestUser();
    await createAccessToken();
    await createTestProperty();
  });

  afterEach(async () => {
    await removeAllTestProperties();
    await removeAllTestUsers();
  });

  it('should return an error if property is not owned by current user', async () => {
    const role = await getTestRole('user');
    const otherUser = await createTestUser({
      username: 'test1',
      email: 'test1@me.com',
      roleId: role.id,
    });
    const otherProperty = await createTestProperty({
      name: 'test1',
      description: 'test',
      address: 'test',
      regularPrice: 10.0,
      bathroom: 2,
      bedroom: 5,
      parking: true,
      furnished: false,
      offer: true,
      type: 'sale',
      ownerId: otherUser.id,
    });

    await updateTestUser({ roleId: role.id });
    await createAccessToken();

    const result = await request(app)
      .patch(`/api/properties/${otherProperty.id}`)
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(403);
    expect(result.body.message).toBe('Permission denied');
  });

  it('should return an error if property id is invalid', async () => {
    const result = await request(app)
      .patch('/api/properties/invalid-id')
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(400);
    expect(result.body.message).toBe('Validation errors');
    expect(result.body.errors.propertyId).toBeDefined();
  });

  it('should return an error if property is not found', async () => {
    const result = await request(app)
      .patch(`/api/properties/${global.validUUID}`)
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(404);
    expect(result.body.message).toBe('Property not found');
  });

  it('should return an error if input data is invalid', async () => {
    const property = await getTestProperty();
    const result = await request(app)
      .patch(`/api/properties/${property.id}`)
      .set('Authorization', `Bearer ${global.accessToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('name', '')
      .field('description', '');

    expect(result.status).toBe(400);
    expect(result.body.message).toBe('Validation errors');
    expect(result.body.errors.name).toBeDefined();
    expect(result.body.errors.description).toBeDefined();
  });

  it('should update property without changing images', async () => {
    const property = await getTestProperty();
    const result = await request(app)
      .patch(`/api/properties/${property.id}`)
      .set('Authorization', `Bearer ${global.accessToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('name', 'test1')
      .field('description', 'test1');

    expect(result.status).toBe(200);
    expect(result.body.message).toBe('Property updated successfully');
    expect(result.body.data.name).toBe('test1');
    expect(result.body.data.description).toBe('test1');
  });

  it('should update property with changing images', async () => {
    const property = await getTestProperty();
    const result = await request(app)
      .patch(`/api/properties/${property.id}`)
      .set('Authorization', `Bearer ${global.accessToken}`)
      .set('Content-Type', 'multipart/form-data')
      .field('name', 'test1')
      .field('description', 'test1')
      .attach('images', global.testPropertyImagePath);

    const updatedProperty = await getTestProperty(result.body.data.name);
    const imagesExist = await checkFileExists(updatedProperty.images);

    expect(result.status).toBe(200);
    expect(result.body.message).toBe('Property updated successfully');
    expect(result.body.data.name).toBe('test1');
    expect(result.body.data.description).toBe('test1');
    expect(imagesExist).toBe(true);

    await removeTestFile(updatedProperty.images);
  });
});

describe('DELETE /api/properties/:propertyId', () => {
  beforeEach(async () => {
    await createTestUser();
    await createAccessToken();
    await createTestProperty();
  });

  afterEach(async () => {
    await removeAllTestProperties();
    await removeAllTestUsers();
  });

  it('should return an error if property is not owned by current user', async () => {
    const role = await getTestRole('user');
    const otherUser = await createTestUser({
      username: 'test1',
      email: 'test1@me.com',
      roleId: role.id,
    });
    const otherProperty = await createTestProperty({
      name: 'test1',
      description: 'test',
      address: 'test',
      regularPrice: 10.0,
      bathroom: 2,
      bedroom: 5,
      parking: true,
      furnished: false,
      offer: true,
      type: 'sale',
      ownerId: otherUser.id,
    });

    await updateTestUser({ roleId: role.id });
    await createAccessToken();

    const result = await request(app)
      .delete(`/api/properties/${otherProperty.id}`)
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(403);
    expect(result.body.message).toBe('Permission denied');
  });

  it('should return an error if property id is invalid', async () => {
    const result = await request(app)
      .delete('/api/properties/invalid-id')
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(400);
    expect(result.body.message).toBe('Validation errors');
    expect(result.body.errors.propertyId).toBeDefined();
  });

  it('should return an error if property is not found', async () => {
    const result = await request(app)
      .delete(`/api/properties/${global.validUUID}`)
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(404);
    expect(result.body.message).toBe('Property not found');
  });

  it('should delete property with removing images', async () => {
    const property = await getTestProperty();
    const uploadResult = await cloudinary.uploader.upload(
      global.testPropertyImagePath,
      { folder: 'properties' }
    );

    await updateTestProperty({
      images: [uploadResult.secure_url],
    });
    const updatedProperty = getTestProperty();
    const result = await request(app)
      .delete(`/api/properties/${property.id}`)
      .set('Authorization', `Bearer ${global.accessToken}`);

    const imagesExist = await checkFileExists(updatedProperty.images);

    expect(result.status).toBe(200);
    expect(result.body.message).toBe('Property deleted successfully');
    expect(imagesExist).toBe(false);
  });
});

describe('POST /api/properties/:propertyId/images', () => {
  it('should upload property images', async () => {
    await createTestUser();
    await createAccessToken();
    await createTestProperty();

    const property = await getTestProperty();
    const result = await request(app)
      .post(`/api/properties/${property.id}/images`)
      .set('Authorization', `Bearer ${global.accessToken}`)
      .set('Content-Type', 'multipart/form-data')
      .attach('images', global.testPropertyImagePath);

    expect(result.status).toBe(201);
    expect(result.body.message).toBe('Property images uploaded successfully');

    const updatedProperty = await getTestProperty();

    await removeAllTestProperties();
    await removeAllTestUsers();
    await removeTestFile(updatedProperty.images);
  });
});

describe('DELETE /api/properties/:propertyId/images', () => {
  beforeEach(async () => {
    await createTestUser();
    await createAccessToken();
    await createTestProperty();
  });

  afterEach(async () => {
    await removeAllTestProperties();
    await removeAllTestUsers();
  });

  it('should return an error if property is not owned by current user', async () => {
    const role = await getTestRole('user');
    const otherUser = await createTestUser({
      username: 'test1',
      email: 'test1@me.com',
      roleId: role.id,
    });
    const otherProperty = await createTestProperty({
      name: 'test1',
      description: 'test',
      address: 'test',
      regularPrice: 10.0,
      bathroom: 2,
      bedroom: 5,
      parking: true,
      furnished: false,
      offer: true,
      type: 'sale',
      ownerId: otherUser.id,
    });

    await updateTestUser({ roleId: role.id });
    await createAccessToken();

    const result = await request(app)
      .delete(`/api/properties/${otherProperty.id}/images`)
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(403);
    expect(result.body.message).toBe('Permission denied');
  });

  it('should return an error if property id is invalid', async () => {
    const result = await request(app)
      .delete('/api/properties/invalid-id/images')
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(400);
    expect(result.body.message).toBe('Validation errors');
    expect(result.body.errors.propertyId).toBeDefined();
  });

  it('should return an error if property is not found', async () => {
    const result = await request(app)
      .delete(`/api/properties/${global.validUUID}/images`)
      .set('Authorization', `Bearer ${global.accessToken}`);

    expect(result.status).toBe(404);
    expect(result.body.message).toBe('Property not found');
  });

  it('should delete property images', async () => {
    const property = await getTestProperty();
    const uploadResult = await cloudinary.uploader.upload(
      global.testPropertyImagePath,
      { folder: 'properties' }
    );

    await updateTestProperty({
      images: [uploadResult.secure_url],
    });
    const updatedProperty = await getTestProperty();
    const result = await request(app)
      .delete(`/api/properties/${property.id}/images`)
      .set('Authorization', `Bearer ${global.accessToken}`)
      .send({
        image: updatedProperty.images[0],
      });

    const imagesExist = await checkFileExists(updatedProperty.images);

    expect(result.status).toBe(200);
    expect(result.body.message).toBe('Property image deleted successfully');
    expect(imagesExist).toBe(false);
  });
});
