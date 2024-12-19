import { expect, it, vi } from 'vitest';
import { createStore, $func, $value } from '..';

it('should trigger multiple times when hierarchy func is set', () => {
  const base$ = $value(0);
  const innerUpdate$ = $func(({ set }) => {
    set(base$, 1);
  });
  const update$ = $func(({ set }) => {
    set(innerUpdate$);
    set(base$, 2);
  });

  const trace = vi.fn();
  const store = createStore();
  store.sub(
    base$,
    $func(() => {
      trace();
    }),
  );

  store.set(update$);

  expect(trace).toHaveBeenCalledTimes(2);
});

it('should trigger subscriber if func throws', () => {
  const base$ = $value(0);
  const action$ = $func(({ set }) => {
    set(base$, 1);
    throw new Error('test');
  });

  const trace = vi.fn();
  const store = createStore();
  store.sub(
    base$,
    $func(() => {
      trace();
    }),
  );

  expect(() => {
    store.set(action$);
  }).toThrow('test');
  expect(trace).toHaveBeenCalledTimes(1);
});
