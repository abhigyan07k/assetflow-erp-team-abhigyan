import { STORAGE_KEYS, type StorageKey } from '@core/constants/storageKeys';
import type { ApiResponse, ApplicationState } from '@core/types';
import { isRecord } from '@core/utils/object';
import { createSeedApplicationState } from '@data/seedData';

export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const requiredArrayKeys = [
  'departments',
  'categories',
  'employees',
  'assets',
  'allocations',
  'transfers',
  'bookings',
  'maintenance',
  'audits',
  'notifications',
  'auditLogs'
] as const satisfies ReadonlyArray<keyof ApplicationState>;

function isApplicationState(value: unknown): value is ApplicationState {
  if (!isRecord(value)) return false;

  return (
    requiredArrayKeys.every((key) => Array.isArray(value[key])) &&
    typeof value.activeRole === 'string' &&
    typeof value.activeCalendarMonth === 'number' &&
    typeof value.activeCalendarYear === 'number' &&
    typeof value.bookingLayout === 'string' &&
    typeof value.assetView === 'string' &&
    typeof value.maintView === 'string' &&
    typeof value.strictBooking === 'boolean'
  );
}

export class StorageService {
  constructor(private readonly storage: StoragePort = window.localStorage) {}

  loadApplicationState(key: StorageKey = STORAGE_KEYS.database): ApiResponse<ApplicationState> {
    const raw = this.storage.getItem(key);
    if (!raw) {
      return { ok: true, data: createSeedApplicationState() };
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isApplicationState(parsed)) {
        return { ok: false, error: 'Persisted database shape is invalid.' };
      }

      return { ok: true, data: parsed };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to parse persisted database.';
      return { ok: false, error: message };
    }
  }

  saveApplicationState(state: Readonly<ApplicationState>, key: StorageKey = STORAGE_KEYS.database): void {
    this.storage.setItem(key, JSON.stringify(state));
  }

  resetApplicationState(key: StorageKey = STORAGE_KEYS.database): ApplicationState {
    const seeded = createSeedApplicationState();
    this.storage.removeItem(key);
    this.saveApplicationState(seeded, key);
    return seeded;
  }
}

export const storageService = new StorageService();
