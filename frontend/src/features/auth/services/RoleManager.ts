import type { Role } from '@core/types';

const roleLabels: Record<Role, string> = {
  admin: 'Administrator',
  manager: 'Asset Manager',
  head: 'Dept Head',
  employee: 'Employee'
};

export function formatRoleName(role: Role): string {
  return roleLabels[role];
}

export function isRole(value: string): value is Role {
  return value === 'admin' || value === 'manager' || value === 'head' || value === 'employee';
}
