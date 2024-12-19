import type { CallbackFunc, StoreInterceptor } from '../../types/core/store';
import type { StoreEventType } from '../../types/debug/event';
import type { Computed, Command, Updater, State } from '../core';

export interface AtomWatch {
  target: State<unknown> | Computed<unknown> | Command<unknown, unknown[]> | string | RegExp;
  actions?: Set<StoreEventType>;
}

export class ConsoleInterceptor implements StoreInterceptor {
  constructor(private readonly watches: AtomWatch[]) {}

  private shouldLog = (
    atom: State<unknown> | Computed<unknown> | Command<unknown, unknown[]>,
    action: StoreEventType,
  ) => {
    return this.watches.some((watch) => {
      if (typeof watch.target === 'string') {
        return atom.toString().includes(watch.target);
      }

      if (watch.target instanceof RegExp) {
        return watch.target.test(atom.toString());
      }

      return watch.target === atom && (!watch.actions || watch.actions.has(action));
    });
  };

  get = <T>(atom$: State<T> | Computed<T>, fn: () => T) => {
    if (!this.shouldLog(atom$, 'get')) {
      fn();
      return;
    }

    console.group('[R][GET] ' + atom$.toString());
    console.log('ret:', fn());
    console.groupEnd();
  };

  computed = <T>(atom$: Computed<T>, fn: () => T) => {
    if (!this.shouldLog(atom$, 'computed')) {
      fn();
      return;
    }

    console.group('[R][CPT] ' + atom$.toString());
    console.log('ret:', fn());
    console.groupEnd();
  };

  set = <T, Args extends unknown[]>(
    atom$: State<T> | Command<T, Args>,
    fn: () => T,
    ...args: Args | [T | Updater<T>]
  ) => {
    if (!this.shouldLog(atom$ as unknown as State<T>, 'set')) {
      fn();
      return;
    }

    console.group('[R][SET] ' + atom$.toString());
    console.log('arg:', args);
    console.log('ret:', fn());
    console.groupEnd();
  };

  sub = <T>(atom$: State<T> | Computed<T>, callback$: CallbackFunc<T>, fn: () => void) => {
    if (!this.shouldLog(atom$, 'sub')) {
      fn();
      return;
    }

    console.group('[R][SUB] ' + atom$.toString() + ', callback=' + callback$.toString());
    fn();
    console.groupEnd();
  };

  unsub = <T>(atom$: State<T> | Computed<T>, callback$: CallbackFunc<T>, fn: () => void) => {
    if (!this.shouldLog(atom$, 'unsub')) {
      fn();
      return;
    }

    console.group('[R][UNS] ' + atom$.toString() + ', callback=' + callback$.toString());
    fn();
    console.groupEnd();
  };

  mount = <T>(atom$: State<T> | Computed<T>) => {
    if (!this.shouldLog(atom$, 'mount')) {
      return;
    }

    console.log('[R][MNT] ' + atom$.toString());
  };

  unmount = <T>(atom$: State<T> | Computed<T>) => {
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
