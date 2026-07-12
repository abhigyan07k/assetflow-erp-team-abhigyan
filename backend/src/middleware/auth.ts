import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../config/db';
import { verifyToken } from '../utils/token';
import ApiError from '../utils/ApiError';

const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication token missing');
    }

    const token = header.split(' ')[1];

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token');
    }

    const revoked = await prisma.revokedToken.findUnique({ where: { jti: decoded.jti } });
    if (revoked) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Session has been revoked. Please log in again.');
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User no longer exists');
    }
    if (user.status === 'SUSPENDED') {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Account suspended. Access denied.');
    }

    req.user = { id: user.id, role: user.role, status: user.status, email: user.email, jti: decoded.jti };
    req.tokenExp = decoded.exp;

    next();
  } catch (err) {
    next(err);
  }
};

export default authenticate;
