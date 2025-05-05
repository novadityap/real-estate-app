import logger from './logger.js';
import ResponseError from './responseError.js';
import prisma from './database.js';

const checkOwnership = async ({
  modelName,
  paramsId,
  ownerFieldName,
  currentUser,
}) => {
    if (currentUser.role === 'admin') return;

    if (modelName === 'user') {
      if (currentUser.id === paramsId) return;

      logger.warn('permission denied');
      throw new ResponseError('Permission denied', 403);
    }

    const resource = await prisma[modelName].findUnique({
      where: {
        id: paramsId,
      },
      select: {
        [ownerFieldName]: true,
      }
    });

    if (!resource) {
      logger.warn(`${modelName.charAt(0).toUpperCase() + modelName.slice(1)} not found`);
      throw new ResponseError(
        `${modelName.charAt(0).toUpperCase() + modelName.slice(1)} not found`,
        404
      );
    }

    if (resource[ownerFieldName] === currentUser.id) return;

    logger.warn('permission denied');
    throw new ResponseError('Permission denied', 403);
};

export default checkOwnership;
