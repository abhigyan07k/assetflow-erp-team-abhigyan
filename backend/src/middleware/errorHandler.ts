import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import logger from '../config/logger';
import ApiError from '../utils/ApiError';

const extractConflictField = (target: unknown): string => {
  if (Array.isArray(target)) return target.join(', ');
  if (typeof target === 'string') {
    const match = target.match(/^[a-zA-Z0-9]+_(.+?)_key$/);
    return match ? match[1] : target;
  }
  return 'field';
};

const handlePrismaError = (err: Prisma.PrismaClientKnownRequestError): { statusCode: number; message: string } => {
  switch (err.code) {
    case 'P2002':
      return {
        statusCode: StatusCodes.CONFLICT,
        message: `A record with this ${extractConflictField(err.meta?.target)} already exists`,
      };
    case 'P2025':
      return { statusCode: StatusCodes.NOT_FOUND, message: 'Record not found' };
    case 'P2003':
      return { statusCode: StatusCodes.BAD_REQUEST, message: 'Invalid reference: the related record does not exist' };
    default:
      return { statusCode: StatusCodes.BAD_REQUEST, message: 'Database request could not be processed' };
  }
};

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, errors, message: 'Validation Error' });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const { statusCode, message } = handlePrismaError(err);
    logger.error(err.message, { code: err.code, meta: err.meta });
    res.status(statusCode).json({ success: false, data: null, message });
    return;
  }

  if (err instanceof ApiError) {
    logger.warn(err.message);
    res.status(err.statusCode).json({ success: false, data: null, message: err.message });
    return;
  }

  const error = err instanceof Error ? err : new Error('Unknown error');
  logger.error(error.message, { stack: error.stack });
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, data: null, message: 'Internal server error' });
};

export default errorHandler;
