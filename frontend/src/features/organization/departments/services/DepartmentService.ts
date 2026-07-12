import type { AuditLog, Department, EntityId } from '@core/types';
import { formatLogDate } from '@core/utils/date';
import { createSequentialId } from '@core/utils/id';
import { appStore, saveState } from '@store/appStore';
import { departmentStore } from '@store/departmentStore';

export interface CreateDepartmentInput {
  name: string;
  code: string;
  parent: EntityId | '';
  head: string;
}

export class DepartmentService {
  createDepartment(input: CreateDepartmentInput): Department {
    const state = appStore.getState();
    const department: Department = {
      id: createSequentialId('d', state.departments.length),
      name: input.name,
      code: input.code,
      parent: input.parent,
      head: input.head,
      status: 'active',
      assetsCount: 0
    };

    const log: AuditLog = {
      id: createSequentialId('l', state.auditLogs.length),
      operator: state.currentUser?.name ?? 'System Admin',
      action: 'CREATE',
      entityType: 'Department',
      details: `Created department: ${input.name}`,
      timestamp: formatLogDate(new Date())
    };

    appStore.update((draft) => {
      draft.departments.push(department);
      draft.auditLogs.unshift(log);
    });
    saveState();
    return department;
  }

  toggleStatus(departmentId: EntityId): Department | null {
    let updated: Department | null = null;
    departmentStore.update((departments) => {
      const department = departments.find((item) => item.id === departmentId);
      if (!department) return;
      department.status = department.status === 'active' ? 'inactive' : 'active';
      updated = department;
    });
    return updated;
  }
}

export const departmentService = new DepartmentService();
