import prisma from  '../utils/database.js';
import logger from '../utils/logger.js';

const clearDatabase = async () => {
  await prisma.$transaction([
    prisma.blacklist.deleteMany(),
    prisma.property.deleteMany(),
    prisma.user.deleteMany(),
    prisma.role.deleteMany(),
  ]);
  
  logger.info('Database cleared');
};

export default clearDatabase;