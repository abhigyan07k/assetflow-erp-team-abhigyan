import type { Role } from '@core/types';
import { formatLogDate } from '@core/utils/date';
import { createNextAssetTag, createSequentialId } from '@core/utils/id';
import { formatRoleName, isRole } from '@features/auth/services/RoleManager';
import { appStore, loadState, resetAppDatabase, saveState } from '@store/appStore';
import { initializeServices } from './providers';

const services = initializeServices();

export interface AssetFlowBridge {
  readonly store: typeof appStore;
  readonly services: typeof services;
  formatLogDate(date: Date): string;
  formatRoleName(role: Role): string;
  isRole(value: string): value is Role;
  createSequentialId(prefix: string, currentLength: number): string;
  createNextAssetTag(lastAssetTag: string | undefined): string;
  loadState(): ReturnType<typeof loadState>;
  saveState(): void;
  resetAppDatabase(): ReturnType<typeof resetAppDatabase>;
}

declare global {
  interface Window {
    AssetFlow?: AssetFlowBridge;
  }
}

export function registerLegacyBridge(): AssetFlowBridge {
  const bridge: AssetFlowBridge = {
    store: appStore,
    services,
    formatLogDate,
    formatRoleName,
    isRole,
    createSequentialId,
    createNextAssetTag,
    loadState,
    saveState,
    resetAppDatabase
  };

  window.AssetFlow = bridge;
  return bridge;
}
