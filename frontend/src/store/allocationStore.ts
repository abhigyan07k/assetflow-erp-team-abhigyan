import type { Allocation, EntityId } from '@core/types';
import { createSliceStore } from './createSliceStore';

const slice = createSliceStore('allocations');

export const allocationStore = {
  getAll: slice.getAll,
  replace: slice.replace,
  update: slice.update,
  findById(allocationId: EntityId): Allocation | undefined {
    return slice.getAll().find((allocation) => allocation.id === allocationId);
  },
  findActiveByAssetId(assetId: EntityId): Allocation | undefined {
    return slice.getAll().find((allocation) => allocation.assetId === assetId && allocation.status !== 'returned');
  }
};
