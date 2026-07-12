import { createSeedApplicationState } from '@data/seedData';
import { storageService } from '@core/storage/StorageService';
import type { ApplicationState } from '@core/types';
import { createStore } from './createStore';

export const appStore = createStore<ApplicationState>(createSeedApplicationState());

export function loadState(): ApplicationState {
  const result = storageService.loadApplicationState();
  const nextState = result.ok && result.data ? result.data : createSeedApplicationState();
  appStore.setState(nextState);
  storageService.saveApplicationState(nextState);
  return nextState;
}

export function saveState(): void {
  storageService.saveApplicationState(appStore.getState());
}

export function resetAppDatabase(): ApplicationState {
  const nextState = storageService.resetApplicationState();
  appStore.setState(nextState);
  return nextState;
}
