import { Role, UserStatus } from '@prisma/client';

export interface AuthenticatedUser {
  id: number;
  role: Role;
  status: UserStatus;
  jti: string;
  email: string;
}
