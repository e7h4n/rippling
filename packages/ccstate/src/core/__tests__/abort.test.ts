import { expect, it, vi } from 'vitest';
import { createStore, $computed, $value } from '..';
import { delay } from 'signal-timers';

it('computed should accept abort signal', async () => {
  const store = createStore();
  const trace = vi.fn();
  const refresh = $value(0);
  const atom = $computed(async (get, { signal }) => {
    const ret = get(refresh);
    await delay(0, { signal });
    trace();
    return ret;
  });

  const ret1 = store.get(atom);
  store.set(refresh, (x) => x + 1);
  const ret2 = store.get(atom);
  await expect(ret1).rejects.toThrow('abort anonymous atom');
  await expect(ret2).resolves.toBe(1);
});
