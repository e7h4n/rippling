export type Updater<T> = (current: T) => T;
export interface Setter {
  <T>(value: Value<T>, val: T | Updater<T>): void;
  <T, Args extends unknown[]>(func: Func<T, Args>, ...args: Args): T;
}
export type Getter = <T>(readable: ReadableAtom<T>) => T;
export interface GetterOptions {
  signal: AbortSignal;
}
export type Read<T> = (get: Getter, options: GetterOptions) => T;
export type Write<T, Args extends unknown[]> = (visitor: { get: Getter; set: Setter }, ...args: Args) => T;

export interface Value<T> {
  init: T;
  debugLabel?: string;
  toString: () => string;
}
export interface Computed<T> {
  read: Read<T>;
  debugLabel?: string;
  toString: () => string;
}
export interface Func<T, Args extends unknown[]> {
  write: Write<T, Args>;
  debugLabel?: string;
  toString: () => string;
}

export type ReadableAtom<T> = Value<T> | Computed<T>;
export type WritableAtom<T> = Value<T> | Func<T, unknown[]>;
