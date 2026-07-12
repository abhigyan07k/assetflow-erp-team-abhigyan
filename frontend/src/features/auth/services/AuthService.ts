import type { AuditLog, Employee, Role } from '@core/types';
import { formatLogDate } from '@core/utils/date';
import { createSequentialId } from '@core/utils/id';
import { appStore, saveState } from '@store/appStore';
import { employeeStore } from '@store/employeeStore';

export interface LoginInput {
  email: string;
}

export interface SignupInput {
  name: string;
  email: string;
}

export class AuthService {
  login(input: LoginInput): Employee | null {
    const user = employeeStore.findByEmail(input.email);
    if (!user) return null;

    appStore.update((draft) => {
      draft.currentUser = user;
      draft.activeRole = user.role;
    });
    saveState();
    return user;
  }

  signup(input: SignupInput): Employee {
    const state = appStore.getState();
    const newEmployee: Employee = {
      id: createSequentialId('e', state.employees.length),
      name: input.name,
      email: input.email,
      departmentId: 'd-1',
      role: 'employee',
      status: 'active'
    };

    const auditLog: AuditLog = {
      id: createSequentialId('l', state.auditLogs.length),
      operator: input.name,
      action: 'CREATE',
      entityType: 'User',
      details: `Self-registered new employee account (${input.email})`,
      timestamp: formatLogDate(new Date())
    };

    appStore.update((draft) => {
      draft.employees.push(newEmployee);
      draft.auditLogs.unshift(auditLog);
    });
    saveState();
    return newEmployee;
  }

  emailExists(email: string): boolean {
    return Boolean(employeeStore.findByEmail(email));
  }

  logout(): void {
    appStore.update((draft) => {
      draft.currentUser = null;
    });
    saveState();
  }

  changeRole(role: Role): void {
    appStore.update((draft) => {
      draft.activeRole = role;
    });
    saveState();
  }
}

export const authService = new AuthService();
