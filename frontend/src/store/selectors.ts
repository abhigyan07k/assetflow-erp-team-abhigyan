import { appStore } from './appStore';

export function selectSlice<TKey extends keyof ReturnType<typeof appStore.getState>>(
  key: TKey
): Readonly<ReturnType<typeof appStore.getState>[TKey]> {
  return appStore.getState()[key];
}
