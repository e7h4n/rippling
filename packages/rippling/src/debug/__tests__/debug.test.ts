import { expect, it, vi } from 'vitest';
import { $computed, $func, $value } from '../../core';
import { consoleLoggingInterceptor, createDebugStore, nestedAtomToString } from '..';

it('get all subscribed atoms', () => {
  const store = createDebugStore();
  const base = $value(1, { debugLabel: 'base' });
  const derived = $computed((get) => get(base) + 1, { debugLabel: 'derived' });
  store.sub(
    [base, derived],
    $func(
      () => {
        void 0;
      },
      { debugLabel: 'sub' },
    ),
  );
  expect(nestedAtomToString(store.getSubscribeGraph())).toEqual([
    ['base', 'sub'],
    ['derived', 'sub'],
  ]);
});

it('cant get read depts if atom is not subscribed', () => {
  const store = createDebugStore();
  const base$ = $value(1, { debugLabel: 'base' });
  const derived$ = $computed((get) => get(base$), { debugLabel: 'derived' });

  expect(store.get(derived$)).toBe(1);

  expect(store.getReadDependents(base$)).toEqual([base$]);
});

it('nestedAtomToString will print anonymous if no debugLabel is provided', () => {
  const base$ = $value(1);
  expect(nestedAtomToString([base$])).toEqual(['anonymous']);
});

it('debugStore enableConsoleLogging should log to console', () => {
  const store = createDebugStore(consoleLoggingInterceptor);
  const base$ = $value(1, { debugLabel: 'base$' });
  const derived$ = $computed((get) => get(base$), { debugLabel: 'derived$' });

  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => void 0);

  const unsub = store.sub(
    derived$,
    $func(() => void 0),
  );
  store.set(base$, 2);
  unsub();

  expect(consoleSpy).toBeCalledTimes(17); // 17 is a magic number
  consoleSpy.mockRestore();
});
