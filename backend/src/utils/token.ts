import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

export interface TokenPayload {
  userId: number;
  role: Role;
  jti: string;
}

interface GenerateTokenInput {
  userId: number;
  role: Role;
}

interface GenerateTokenResult {
  token: string;
  jti: string;
}

export const generateToken = ({ userId, role }: GenerateTokenInput): GenerateTokenResult => {
  const jti = randomUUID();
  const token = jwt.sign({ userId, role, jti }, JWT_SECRET, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
  });
  return { token, jti };
};

export const verifyToken = (token: string): TokenPayload & jwt.JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload & jwt.JwtPayload;
};
