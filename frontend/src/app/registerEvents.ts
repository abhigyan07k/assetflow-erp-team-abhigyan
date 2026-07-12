import type { ServiceContainer } from './providers';
import { appStore } from '@store/appStore';

export interface RegisteredEvents {
  dispose(): void;
}

export function registerEvents(services: ServiceContainer, targetWindow: Window = window): RegisteredEvents {
  const resizeHandler = (): void => {
    const state = appStore.getState();
    if (targetWindow.innerWidth <= 900 && state.assetView === 'table') {
      appStore.update((draft) => {
        draft.assetView = 'grid';
      });
    }
  };

  const storageHandler = (event: StorageEvent): void => {
    if (event.key === 'assetflow_erp_db') {
      services.storage.loadApplicationState();
    }
  };

  targetWindow.addEventListener('resize', resizeHandler);
  targetWindow.addEventListener('storage', storageHandler);

  return {
    dispose() {
      targetWindow.removeEventListener('resize', resizeHandler);
      targetWindow.removeEventListener('storage', storageHandler);
    }
  };
}
