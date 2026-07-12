import type { Store } from '@core/types';
import { cloneValue } from '@core/utils/object';

type Listener<TState> = (state: Readonly<TState>) => void;

export function createStore<TState>(initialState: TState): Store<TState> {
  let state = cloneValue(initialState);
  const listeners = new Set<Listener<TState>>();

  function notify(): void {
    listeners.forEach((listener) => listener(state));
  }

  return {
    getState() {
      return state;
    },
    setState(nextState) {
      state = cloneValue(nextState);
      notify();
    },
    update(mutator) {
      const draft = cloneValue(state);
      mutator(draft);
      state = draft;
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
