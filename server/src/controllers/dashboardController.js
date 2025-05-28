import logger from '../utils/logger.js';
import prisma from '../utils/database.js';

export const stats = async (req, res, next) => {
  const [totalUsers, totalRoles, totalProperties] = await Promise.all([
    prisma.user.count(),
    prisma.role.count(),
    prisma.property.count(),
  ]);

  const recentProperties = await prisma.property.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      owner: { select: { username: true } },
    },
  });

  logger.info('statistics data retrieved successfully');
  res.status(200).json({
    code: 200,
    message: 'Statistics data retrieved successfully',
    data: {
      totalUsers,
      totalProperties,
      totalRoles,
      recentProperties,
    },
  });
};

export default { stats };
