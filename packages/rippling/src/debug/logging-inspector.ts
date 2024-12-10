import type { CallbackFunc, StoreInterceptor } from '../../types/core/store';
import type { Computed, Func, Updater, Value } from '../core';

export const consoleLoggingInterceptor: StoreInterceptor = {
  get: <T>(atom$: Value<T> | Computed<T>, fn: () => T) => {
    console.log('GET', '[' + atom$.toString() + ']', fn());
  },
  set: <T, Args extends unknown[]>(atom$: Value<T> | Func<T, Args>, fn: () => T, ...args: Args | [T | Updater<T>]) => {
    console.log('SET', '[' + atom$.toString() + ']', args, fn());
  },
  sub: <T>(atom$: Value<T> | Computed<T>, callback$: CallbackFunc<T>, fn: () => void) => {
    fn();
    console.log('SUB', '[' + atom$.toString() + ']', callback$);
  },
  unsub: <T>(atom$: Value<T> | Computed<T>, callback$: CallbackFunc<T>, fn: () => void) => {
    fn();
    console.log('UNSUB', '[' + atom$.toString() + ']', callback$);
  },
  mount: <T>(atom$: Value<T> | Computed<T>) => {
    console.log('MOUNT', '[' + atom$.toString() + ']');
  },
  unmount: <T>(atom$: Value<T> | Computed<T>) => {
    console.log('UNMOUNT', '[' + atom$.toString() + ']');
  },
  notify: <T>(callback$: CallbackFunc<T>, fn: () => T) => {
    console.log('NOTIFY', '[' + callback$.toString() + ']', fn());
  },
};
