import type { Computed, Func, Read, Value, Write } from '../../types/core/atom';

interface Options {
  debugLabel?: string;
}

let globalId = 0;

const generateToString = (prefix: string, debugLabel?: string) => {
  const id = globalId++;
  const label = `${prefix}${String(id)}${debugLabel ? ':' + debugLabel : ''}`;
  return () => label;
};

export function $value<T>(init: T, options?: Options): Value<T> {
  const ret: Value<T> = {
    init,
    toString: generateToString('V', options?.debugLabel),
  };

  if (options?.debugLabel) {
    ret.debugLabel = options.debugLabel;
  }
  return ret;
}

export function $computed<T>(read: Read<T>, options?: Options): Computed<T> {
  const ret: Computed<T> = {
    read,
    toString: generateToString('C', options?.debugLabel),
  };
  if (options?.debugLabel) {
    ret.debugLabel = options.debugLabel;
  }
  return ret;
}

export function $func<T, Args extends unknown[]>(write: Write<T, Args>, options?: Options): Func<T, Args> {
  const ret: Func<T, Args> = {
    write,
    toString: generateToString('F', options?.debugLabel),
  };
  if (options?.debugLabel) {
    ret.debugLabel = options.debugLabel;
  }
  return ret;
}
