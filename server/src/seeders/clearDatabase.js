import prisma from  '../utils/database.js';
import logger from '../utils/logger.js';

const clearDatabase = async () => {
  await prisma.blacklist.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  logger.info('Database cleared');
};

export default clearDatabase;