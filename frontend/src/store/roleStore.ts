import type { Role } from '@core/types';
import { appStore, saveState } from './appStore';

export const roleStore = {
  getActiveRole(): Role {
    return appStore.getState().activeRole;
  },
  setActiveRole(role: Role): void {
    appStore.update((draft) => {
      draft.activeRole = role;
    });
    saveState();
  }
};
