import { useSyncExternalStore } from 'react';
import { useStore } from './provider';
import { $func } from '../core';
import type { Computed, State } from '../core';

export function useGet<T>(atom: State<T> | Computed<T>) {
  const store = useStore();
  return useSyncExternalStore(
    (fn) => {
      const ctrl = new AbortController();
      store.sub(atom, $func(fn), { signal: ctrl.signal });
      return () => {
        ctrl.abort();
      };
    },
    () => {
      return store.get(atom);
    },
  );
}
