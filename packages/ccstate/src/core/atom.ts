import type { Computed, Command, Read, State, Write } from '../../types/core/atom';

interface Options {
  debugLabel?: string;
}

let globalId = 0;

const generateToString = (prefix: string, debugLabel?: string) => {
  const id = globalId++;
  const label = `${prefix}${String(id)}${debugLabel ? ':' + debugLabel : ''}`;
  return () => label;
};

export function state<T>(init: T, options?: Options): State<T> {
  const ret: State<T> = {
    init,
    toString: generateToString('V', options?.debugLabel),
  };

  if (options?.debugLabel) {
    ret.debugLabel = options.debugLabel;
  }
  return ret;
}

export function computed<T>(read: Read<T>, options?: Options): Computed<T> {
  const ret: Computed<T> = {
    read,
    toString: generateToString('C', options?.debugLabel),
  };
  if (options?.debugLabel) {
    ret.debugLabel = options.debugLabel;
  }
  return ret;
}

export function command<T, Args extends unknown[]>(write: Write<T, Args>, options?: Options): Command<T, Args> {
  const ret: Command<T, Args> = {
    write,
    toString: generateToString('F', options?.debugLabel),
  };
  if (options?.debugLabel) {
    ret.debugLabel = options.debugLabel;
  }
  return ret;
}
