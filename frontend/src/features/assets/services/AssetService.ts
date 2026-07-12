import type { Asset, EntityId } from '@core/types';
import { createNextAssetTag, createSequentialId } from '@core/utils/id';
import { appStore, saveState } from '@store/appStore';
import { assetStore } from '@store/assetStore';

export interface RegisterAssetInput {
  name: string;
  categoryId: EntityId;
  serial: string;
  cost: number;
  acquireDate: Asset['acquireDate'];
  condition: Asset['condition'];
  location: string;
  isBookable: boolean;
  warrantyField: string;
}

export class AssetService {
  registerAsset(input: RegisterAssetInput): Asset {
    const assets = assetStore.getAll();
    const lastAsset = assets.at(-1);
    const newAsset: Asset = {
      id: createSequentialId('a', assets.length),
      name: input.name,
      categoryId: input.categoryId,
      assetTag: createNextAssetTag(lastAsset?.assetTag),
      serial: input.serial,
      cost: input.cost,
      acquireDate: input.acquireDate,
      condition: input.condition,
      location: input.location,
      isBookable: input.isBookable,
      warrantyField: input.warrantyField || '12 Months Limited Standard Warranty',
      status: 'available'
    };

    appStore.update((draft) => {
      draft.assets.push(newAsset);
    });
    saveState();
    return newAsset;
  }

  findById(assetId: EntityId): Asset | undefined {
    return assetStore.findById(assetId);
  }
}

export const assetService = new AssetService();
