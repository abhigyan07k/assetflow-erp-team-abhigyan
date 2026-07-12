import type { Asset, EntityId } from '@core/types';
import { createSliceStore } from './createSliceStore';

const slice = createSliceStore('assets');

export const assetStore = {
  getAll: slice.getAll,
  replace: slice.replace,
  update: slice.update,
  findById(assetId: EntityId): Asset | undefined {
    return slice.getAll().find((asset) => asset.id === assetId);
  },
  findByTag(assetTag: string): Asset | undefined {
    return slice.getAll().find((asset) => asset.assetTag.toLowerCase() === assetTag.toLowerCase());
  }
};
