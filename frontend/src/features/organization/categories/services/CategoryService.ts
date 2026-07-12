import type { AuditLog, Category } from '@core/types';
import { formatLogDate } from '@core/utils/date';
import { createSequentialId } from '@core/utils/id';
import { appStore, saveState } from '@store/appStore';

export interface CreateCategoryInput {
  name: string;
  icon: string;
  warrantyMonths: number;
  customField: string;
}

export class CategoryService {
  createCategory(input: CreateCategoryInput): Category {
    const state = appStore.getState();
    const category: Category = {
      id: createSequentialId('c', state.categories.length),
      name: input.name,
      icon: input.icon,
      warrantyMonths: input.warrantyMonths,
      customField: input.customField
    };

    const log: AuditLog = {
      id: createSequentialId('l', state.auditLogs.length),
      operator: state.currentUser?.name ?? 'System Admin',
      action: 'CREATE',
      entityType: 'Category',
      details: `Created asset category: ${input.name}`,
      timestamp: formatLogDate(new Date())
    };

    appStore.update((draft) => {
      draft.categories.push(category);
      draft.auditLogs.unshift(log);
    });
    saveState();
    return category;
  }
}

export const categoryService = new CategoryService();
