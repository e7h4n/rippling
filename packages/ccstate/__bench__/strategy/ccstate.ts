import type { Strategy } from './type';
import { createStore, $computed, $func, $value } from '../../src';
import type { Computed, Value } from '../../src';

export const ccstateStrategy: Strategy<Value<number> | Computed<number>, ReturnType<typeof createStore>> = {
  createStore() {
    return createStore();
  },
  createValue(val: number) {
    return $value(val);
  },
  createComputed(compute) {
    return $computed((get) => compute(get));
  },
  sub(store, atom, callback) {
    return store.sub(
      atom,
      $func(() => {
        callback();
      }),
    );
  },
  get(store, atom) {
    return store.get(atom);
  },
};
