import { PrismaClient } from '@prisma/client';
import logger from './logger.js';

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

prisma.$on('query', e => {
  logger.info(`[PRISMA QUERY] ${JSON.stringify(e)}`);
});

prisma.$on('error', e => {
  logger.error(`[PRISMA ERROR] ${JSON.stringify(e)}`);
});

prisma.$on('info', e => {
  logger.info(`[PRISMA INFO] ${JSON.stringify(e)}`);
});

prisma.$on('warn', e => {
  logger.warn(`[PRISMA WARN] ${JSON.stringify(e)}`);
});

export default prisma;
