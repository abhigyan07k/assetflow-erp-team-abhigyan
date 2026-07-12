import type { Department, EntityId } from '@core/types';
import { createSliceStore } from './createSliceStore';

const slice = createSliceStore('departments');

export const departmentStore = {
  getAll: slice.getAll,
  replace: slice.replace,
  update: slice.update,
  findById(departmentId: EntityId): Department | undefined {
    return slice.getAll().find((department) => department.id === departmentId);
  }
};
