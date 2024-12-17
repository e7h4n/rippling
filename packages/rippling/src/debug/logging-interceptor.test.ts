import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ConsoleInterceptor } from './console-inspector';
import { $computed, $func, $value, createDebugStore } from '../';

const base1$ = $value(0, { debugLabel: 'base$' });
const base2$ = $value(0, { debugLabel: 'base$' });
const doubleBase1$ = $computed((get) => {
  return get(base1$) * 2;
});
const callback$ = $func(() => void 0, {
  debugLabel: 'callback$',
});

beforeEach(() => {
  vi.spyOn(console, 'group').mockImplementation(() => void 0);
  vi.spyOn(console, 'groupEnd').mockImplementation(() => void 0);
  vi.spyOn(console, 'log').mockImplementation(() => void 0);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function runStore(interceptor: ConsoleInterceptor) {
  const store = createDebugStore(interceptor);
  store.set(base1$, 1);
  store.set(base2$, 2);
  const unsub = store.sub(doubleBase1$, callback$);
  store.get(base1$);
  store.set(base1$, 3);
  unsub();
}

it('should log specified atoms to console', () => {
  const interceptor = new ConsoleInterceptor([
    {
      target: base1$,
      actions: new Set(['set']),
    },
  ]);

  runStore(interceptor);

  expect(console.group).toBeCalledTimes(2);
});

it('should log mount', () => {
  const interceptor = new ConsoleInterceptor([
    {
      target: base1$,
      actions: new Set(['mount']),
    },
  ]);

  runStore(interceptor);

  expect(console.log).toBeCalledTimes(1);
});

it('should log unmount', () => {
  const interceptor = new ConsoleInterceptor([
    {
      target: base1$,
      actions: new Set(['unmount']),
    },
  ]);

  runStore(interceptor);

  expect(console.log).toBeCalledTimes(1);
});

it('should log sub', () => {
  const interceptor = new ConsoleInterceptor([
    {
      target: doubleBase1$,
      actions: new Set(['sub']),
    },
  ]);

  runStore(interceptor);

  expect(console.group).toBeCalledTimes(1);
});

it('should log unsub', () => {
  const interceptor = new ConsoleInterceptor([
    {
      target: doubleBase1$,
      actions: new Set(['unsub']),
    },
  ]);

  runStore(interceptor);

  expect(console.group).toBeCalledTimes(1);
});

it('should log notify', () => {
  const interceptor = new ConsoleInterceptor([
    {
      target: callback$,
      actions: new Set(['notify']),
    },
  ]);

  runStore(interceptor);

  expect(console.group).toBeCalledTimes(1);
});

it('should log everything of specified atom', () => {
  const interceptor = new ConsoleInterceptor([
    {
      target: callback$,
    },
    {
      target: base1$,
    },
    {
      target: base2$,
    },
    {
      target: doubleBase1$,
    },
  ]);

  runStore(interceptor);

  expect(console.group).toBeCalledTimes(9);
});
