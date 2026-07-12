import { PrismaClient, Prisma } from '@prisma/client';
import logger from './logger';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

prisma.$on('query', (e: Prisma.QueryEvent) => {
  if (process.env.NODE_ENV === 'development') {
    logger.info(`[prisma:query] ${e.query} | params: ${e.params} | ${e.duration}ms`);
  }
});

prisma.$on('error', (e: Prisma.LogEvent) => {
  logger.error(`[prisma:error] ${e.message}`);
});

prisma.$on('warn', (e: Prisma.LogEvent) => {
  logger.warn(`[prisma:warn] ${e.message}`);
});

export default prisma;
