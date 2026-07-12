import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const rateLimitHandler = (req: Request, res: Response): void => {
  res.status(StatusCodes.TOO_MANY_REQUESTS).json({
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  });
};

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
