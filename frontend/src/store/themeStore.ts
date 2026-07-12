import type { Theme } from '@core/types';
import { createStore } from './createStore';

export const themeStore = createStore<Theme>('light');
