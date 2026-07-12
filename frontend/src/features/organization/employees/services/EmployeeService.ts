import type { Employee, EntityId, Role } from '@core/types';
import { employeeStore } from '@store/employeeStore';

export class EmployeeService {
  promoteEmployee(employeeId: EntityId, role: Role): Employee | null {
    let updated: Employee | null = null;
    employeeStore.update((employees) => {
      const employee = employees.find((item) => item.id === employeeId);
      if (!employee) return;
      employee.role = role;
      updated = employee;
    });
    return updated;
  }

  toggleStatus(employeeId: EntityId): Employee | null {
    let updated: Employee | null = null;
    employeeStore.update((employees) => {
      const employee = employees.find((item) => item.id === employeeId);
      if (!employee) return;
      employee.status = employee.status === 'active' ? 'inactive' : 'active';
      updated = employee;
    });
    return updated;
  }
}

export const employeeService = new EmployeeService();
