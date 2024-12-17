import type { CallbackFunc, StoreInterceptor } from '../../types/core/store';
import type { Computed, Func, Updater, Value } from '../core';

export interface AtomWatch {
  target: Value<unknown> | Computed<unknown> | Func<unknown, unknown[]>;
  actions?: Set<'set' | 'get' | 'sub' | 'unsub' | 'mount' | 'unmount' | 'notify'>;
}

export class ConsoleInterceptor implements StoreInterceptor {
  constructor(private readonly watches: AtomWatch[]) {}

  private shouldLog = (
    atom: Value<unknown> | Computed<unknown> | Func<unknown, unknown[]>,
    action: 'get' | 'set' | 'sub' | 'unsub' | 'mount' | 'unmount' | 'notify',
  ) => {
    return this.watches.some((watch) => watch.target === atom && (!watch.actions || watch.actions.has(action)));
  };

  get = <T>(atom$: Value<T> | Computed<T>, fn: () => T) => {
    if (!this.shouldLog(atom$, 'get')) {
      fn();
      return;
    }

    console.group('[R][GET] ' + atom$.toString());
    console.log('ret:', fn());
    console.groupEnd();
  };

  set = <T, Args extends unknown[]>(atom$: Value<T> | Func<T, Args>, fn: () => T, ...args: Args | [T | Updater<T>]) => {
    if (!this.shouldLog(atom$ as unknown as Value<T>, 'set')) {
      fn();
      return;
    }

    console.group('[R][SET] ' + atom$.toString());
    console.log('arg:', args);
    console.log('ret:', fn());
    console.groupEnd();
  };

  sub = <T>(atom$: Value<T> | Computed<T>, callback$: CallbackFunc<T>, fn: () => void) => {
    if (!this.shouldLog(atom$, 'sub')) {
      fn();
      return;
    }

    console.group('[R][SUB] ' + atom$.toString() + ', callback=' + callback$.toString());
    fn();
    console.groupEnd();
  };

  unsub = <T>(atom$: Value<T> | Computed<T>, callback$: CallbackFunc<T>, fn: () => void) => {
    if (!this.shouldLog(atom$, 'unsub')) {
      fn();
      return;
    }

    console.group('[R][UNS] ' + atom$.toString() + ', callback=' + callback$.toString());
    fn();
    console.groupEnd();
  };

  mount = <T>(atom$: Value<T> | Computed<T>) => {
    if (!this.shouldLog(atom$, 'mount')) {
      return;
    }

    console.log('[R][MNT] ' + atom$.toString());
  };

  unmount = <T>(atom$: Value<T> | Computed<T>) => {
    if (!this.shouldLog(atom$, 'unmount')) {
      return;
    }

    console.log('[R][UNM] ' + atom$.toString());
  };

  notify = <T>(callback$: CallbackFunc<T>, fn: () => T) => {
    if (!this.shouldLog(callback$, 'notify')) {
      fn();
      return;
    }

    console.group('[R][NTF] ' + callback$.toString());
    console.log('ret:', fn());
    console.groupEnd();
  };
}
