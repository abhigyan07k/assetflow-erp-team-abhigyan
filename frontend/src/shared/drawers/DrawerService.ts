import type { Drawer } from '@core/types';
import { createStore } from '@store/createStore';

export const drawerStore = createStore<Record<string, Drawer>>({});

export class DrawerService {
  open(drawerId: string): void {
    drawerStore.update((drawers) => {
      drawers[drawerId] = { id: drawerId, isOpen: true };
    });
  }

  close(drawerId: string): void {
    drawerStore.update((drawers) => {
      drawers[drawerId] = { id: drawerId, isOpen: false };
    });
  }

  isOpen(drawerId: string): boolean {
    return drawerStore.getState()[drawerId]?.isOpen ?? false;
  }
}

export const drawerService = new DrawerService();
