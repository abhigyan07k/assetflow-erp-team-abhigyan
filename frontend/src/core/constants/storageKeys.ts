export const STORAGE_KEYS = {
  database: 'assetflow_erp_db'
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
