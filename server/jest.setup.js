import 'dotenv/config';
import seedRole from './src/seeders/roleSeeder.js';
import { createToken } from './tests/testUtil.js';
import { v4 as uuidv4 } from 'uuid';
import clearDatabase from './src/seeders/clearDatabase.js';

beforeAll(async () => {
  await clearDatabase();
  await seedRole();

  global.userToken = createToken('auth', 'user');
  global.adminToken = createToken('auth', 'admin');
  global.adminRefreshToken = createToken('refresh', 'admin');
  global.validUUID = uuidv4();
});