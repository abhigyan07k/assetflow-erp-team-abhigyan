import type { Employee, EntityId } from '@core/types';
import { createSliceStore } from './createSliceStore';

const slice = createSliceStore('employees');

export const employeeStore = {
  getAll: slice.getAll,
  replace: slice.replace,
  update: slice.update,
  findById(employeeId: EntityId): Employee | undefined {
    return slice.getAll().find((employee) => employee.id === employeeId);
  },
  findByEmail(email: string): Employee | undefined {
    return slice.getAll().find((employee) => employee.email.toLowerCase() === email.toLowerCase());
  }
};
