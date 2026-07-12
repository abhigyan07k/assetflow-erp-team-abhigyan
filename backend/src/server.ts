import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import { StatusCodes } from 'http-status-codes';

import prisma from './config/db';
import logger from './config/logger';
import httpLogger from './middleware/httpLogger';
import { globalLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/authRoutes';
import assetRoutes from './routes/assetRoutes';
import requestRoutes from './routes/requestRoutes';
import auditRoutes from './routes/auditRoutes';
import errorHandler from './middleware/errorHandler';
import ApiError from './utils/ApiError';
import ApiResponse from './utils/ApiResponse';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(httpLogger);
app.use(globalLimiter);

app.get('/api/health', (req, res) => {
  return res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, { status: 'ok' }, 'Service is healthy'));
});

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/audit-logs', auditRoutes);

app.use((req) => {
  throw new ApiError(StatusCodes.NOT_FOUND, `Route ${req.originalUrl} not found`);
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(Number(PORT), '0.0.0.0', () => {
  logger.info(`AssetFlow backend running on port ${PORT}`);
});

const shutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Database connection closed. Process terminated.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export default server;
