import { AuthenticatedUser } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      tokenExp?: number;
    }
  }
}

export {};
