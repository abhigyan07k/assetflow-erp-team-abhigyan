import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Role } from '@prisma/client';
import ApiError from '../utils/ApiError';

const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      next(new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to perform this action'));
      return;
    }
    next();
  };
};

export default authorizeRoles;
