import type { AuditLog } from '@core/types';
import { createSliceStore } from './createSliceStore';

const slice = createSliceStore('auditLogs');

export const auditLogStore = {
  getAll: slice.getAll,
  replace: slice.replace,
  update: slice.update,
  prepend(log: AuditLog): void {
    slice.update((logs) => {
      logs.unshift(log);
    });
  }
};
