import type { Category, EntityId } from '@core/types';
import { createSliceStore } from './createSliceStore';

const slice = createSliceStore('categories');

export const categoryStore = {
  getAll: slice.getAll,
  replace: slice.replace,
  update: slice.update,
  findById(categoryId: EntityId): Category | undefined {
    return slice.getAll().find((category) => category.id === categoryId);
  }
};
