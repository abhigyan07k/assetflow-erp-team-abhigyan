import type { ApplicationState } from '@core/types';
import { appStore, saveState } from './appStore';

export interface SliceStore<TKey extends keyof ApplicationState> {
  getAll(): Readonly<ApplicationState[TKey]>;
  replace(nextSlice: ApplicationState[TKey]): void;
  update(mutator: (draft: ApplicationState[TKey]) => void): void;
}

export function createSliceStore<TKey extends keyof ApplicationState>(key: TKey): SliceStore<TKey> {
  return {
    getAll() {
      return appStore.getState()[key];
    },
    replace(nextSlice) {
      appStore.update((draft) => {
        draft[key] = nextSlice;
      });
      saveState();
    },
    update(mutator) {
      appStore.update((draft) => {
        mutator(draft[key]);
      });
      saveState();
    }
  };
}
