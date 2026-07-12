import type { EntityId, Transfer } from '@core/types';
import { createSliceStore } from './createSliceStore';

const slice = createSliceStore('transfers');

export const transferStore = {
  getAll: slice.getAll,
  replace: slice.replace,
  update: slice.update,
  findById(transferId: EntityId): Transfer | undefined {
    return slice.getAll().find((transfer) => transfer.id === transferId);
  }
};
