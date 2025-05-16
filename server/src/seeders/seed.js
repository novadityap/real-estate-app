import seedRole from './roleSeeder.js';
import seedUser from './userSeeder.js';
import clearDatabase from './clearDatabase.js';
import logger from '../utils/logger.js';

const seed = async () => {
  try {
    await clearDatabase();
    await seedRole();
    await seedUser();

    logger.info('Database seeded successfully');
    process.exit(0);
  } catch (e) {
    logger.error('Database seeded unsuccessfully', {stack: e.stack});
    process.exit(1);
  }
};

seed();

export default seed;