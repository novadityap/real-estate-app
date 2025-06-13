import 'dotenv/config';
import seedRole from './src/seeders/roleSeeder.js';
import { v4 as uuidv4 } from 'uuid';
import clearDatabase from './src/seeders/clearDatabase.js';
import path from 'node:path';

beforeAll(async () => {
  await clearDatabase();
  await seedRole();
  
  global.validUUID = uuidv4();
  global.testAvatarPath = path.resolve(
    process.env.AVATAR_DIR_TEST,
    'test-avatar.jpg'
  );
  global.testPropertyImagePath = path.resolve(
    process.env.PROPERTY_DIR_TEST,
    'test-image.jpg'
  );
});