import logger from '../utils/logger.js';
import prisma from '../utils/database.js';

const seedRole = async () => {
  const roles = ['user', 'admin'];
  
  await prisma.$transaction([
    prisma.user.deleteMany({
      where: {
        role: { name: { in: ['admin', 'user'] } },
      },
    }),
    prisma.role.deleteMany({
      where: {
        name: { in: ['admin', 'user'] },
      },
    }),
    prisma.role.createMany({
      data: roles.map((role) => ({ name: role })),
    }),
  ]);

  logger.info('roles seeded successfully');
};

export default seedRole;
