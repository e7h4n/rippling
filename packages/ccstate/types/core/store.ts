import type { ReadableAtom, Func, Getter, Setter, Value, Computed, Updater } from './atom';

export interface Store {
  get: Getter;
  set: Setter;
  sub: Subscribe;
}

export interface SubscribeOptions {
  signal?: AbortSignal;
}

export type CallbackFunc<T> = Func<T, []>;

export type Subscribe = (
  atoms$: ReadableAtom<unknown>[] | ReadableAtom<unknown>,
  callback: CallbackFunc<unknown>,
  options?: SubscribeOptions,
) => () => void;

export type InterceptorGet = <T>(atom$: Value<T> | Computed<T>, fn: () => T) => void;
export interface InterceptorSet {
  <T, Args extends unknown[]>(func$: Func<T, Args>, fn: () => T, ...args: Args): void;
  <T>(value$: Value<T>, fn: () => void, val: T | Updater<T>): void;
}
export type InterceptorSub = <T>(atom$: ReadableAtom<T>, callback$: CallbackFunc<T>, fn: () => void) => void;
export type InterceptorUnsub = <T>(atom$: ReadableAtom<T>, callback$: CallbackFunc<T>, fn: () => void) => void;
export type InterceptorMount = <T>(atom$: ReadableAtom<T>) => void;
export type InterceptorUnmount = <T>(atom$: ReadableAtom<T>) => void;
export type InterceptorNotify = <T>(callback$: CallbackFunc<T>, fn: () => T) => void;
export type InterceptorComputed = <T>(atom$: Computed<T>, fn: () => T) => void;

export interface StoreInterceptor {
  get?: InterceptorGet;
  set?: InterceptorSet;
  sub?: InterceptorSub;
  unsub?: InterceptorUnsub;
  mount?: InterceptorMount;
  unmount?: InterceptorUnmount;
  notify?: InterceptorNotify;
  computed?: InterceptorComputed;
}

export interface StoreOptions {
  interceptor?: StoreInterceptor;
}
