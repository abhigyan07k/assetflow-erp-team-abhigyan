import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';

interface ValidationSchemas {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}

const validate = (schemas: ValidationSchemas) => (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (schemas.params) {
      req.params = schemas.params.parse(req.params) as unknown as typeof req.params;
    }
    if (schemas.query) {
      req.query = schemas.query.parse(req.query) as unknown as typeof req.query;
    }
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    next();
  } catch (err) {
    next(err);
  }
};

export default validate;
