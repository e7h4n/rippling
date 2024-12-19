import { expect, it, vi } from 'vitest';
import { createStore, $func, $value } from '..';

it('multiple set in async func should trigger notify multiple times', async () => {
  const base = $value(0);
  const action = $func(async ({ set }) => {
    set(base, 1);
    set(base, 2);
    await Promise.resolve();
    set(base, 3);
    set(base, 4);
  });

  const trace = vi.fn();
  const store = createStore();
  store.sub(
    base,
    $func(() => {
      trace();
    }),
  );

  const ret = store.set(action);
  expect(trace).toHaveBeenCalledTimes(2);
  await ret;
  expect(trace).toHaveBeenCalledTimes(4);
});
