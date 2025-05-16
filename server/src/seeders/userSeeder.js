import prisma from '../utils/database.js';
import logger from '../utils/logger.js';
import bcrypt from 'bcrypt';

const seedUser = async () => {
  const [adminRole, userRole] = await Promise.all([
    prisma.role.findUnique({ where: { name: 'admin' } }),
    prisma.role.findUnique({ where: { name: 'user' } }),
  ]);

  const users = [
    {
      email: 'admin@email.com',
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      roleId: adminRole.id,
      avatar: process.env.DEFAULT_AVATAR_URL,
      isVerified: true,
    },
    {
      email: 'user@email.com',
      username: 'user',
      password: await bcrypt.hash('user123', 10),
      roleId: userRole.id,
      avatar: process.env.DEFAULT_AVATAR_URL,
      isVerified: true,
    },
  ];

  await prisma.user.createMany({
    data: users,
  });

  logger.info('users seeded successfully');
};

export default seedUser;
