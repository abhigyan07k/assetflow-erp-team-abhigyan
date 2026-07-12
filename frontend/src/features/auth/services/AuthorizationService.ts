import type { Role, RouteId } from '@core/types';

const routePermissions: Partial<Record<RouteId, ReadonlyArray<Role>>> = {
  'org-setup': ['admin']
};

export class AuthorizationService {
  canAccessRoute(role: Role, routeId: RouteId): boolean {
    const allowedRoles = routePermissions[routeId];
    return allowedRoles ? allowedRoles.includes(role) : true;
  }
}

export const authorizationService = new AuthorizationService();
