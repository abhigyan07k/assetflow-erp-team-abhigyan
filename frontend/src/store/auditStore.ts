import type { AuditCycle, EntityId } from '@core/types';
import { createSliceStore } from './createSliceStore';

const slice = createSliceStore('audits');

export const auditStore = {
  getAll: slice.getAll,
  replace: slice.replace,
  update: slice.update,
  findById(auditId: EntityId): AuditCycle | undefined {
    return slice.getAll().find((audit) => audit.id === auditId);
  }
};
