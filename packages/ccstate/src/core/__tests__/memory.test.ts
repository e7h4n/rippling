import LeakDetector from 'jest-leak-detector';
import { expect, it } from 'vitest';
import { $value, $computed, createStore, $func } from '..';
import { createDebugStore } from '../../debug';
import type { Computed, Value } from '..';

it('should release memory after delete value', async () => {
  const store = createStore();
  let base: Value<object> | undefined = $value({});

  const detector = new LeakDetector(store.get(base));
  base = undefined;

  expect(await detector.isLeaking()).toBe(false);
});

it('should release memory after base value & derived computed is deleted', async () => {
  const store = createStore();
  let base: Value<object> | undefined = $value({});
  let derived: Computed<object> | undefined = $computed((get) => ({
    obj: base && get(base),
  }));
  const detector1 = new LeakDetector(store.get(base));
  const detector2 = new LeakDetector(store.get(derived));

  base = undefined;
  derived = undefined;

  expect(await detector1.isLeaking()).toBe(false);
  expect(await detector2.isLeaking()).toBe(false);
});

it('with a long-lived base value', async () => {
  const store = createStore();
  const base = $value({});

  let cmpt: Computed<object> | undefined = $computed((get) => ({
    obj: get(base),
  }));

  const detector = new LeakDetector(store.get(cmpt));
  cmpt = undefined;
  expect(await detector.isLeaking()).toBe(false);
});

it('should not hold onto dependent atoms that are not mounted', async () => {
  const store = createStore();
  const base = $value({});
  let cmpt: Computed<unknown> | undefined = $computed((get) => get(base));
  const detector = new LeakDetector(cmpt);
  store.get(cmpt);
  cmpt = undefined;
  await expect(detector.isLeaking()).resolves.toBe(false);
});

it('unsubscribe on atom should release memory', async () => {
  const store = createStore();
  let objAtom: Value<object> | undefined = $value({});
  const detector = new LeakDetector(store.get(objAtom));
  let unsub: (() => void) | undefined = store.sub(
    objAtom,
    $func(() => {
      return;
    }),
  );

  unsub();
  unsub = undefined;
  objAtom = undefined;
  expect(await detector.isLeaking()).toBe(false);
});

it('unsubscribe on computed should release memory', async () => {
  const store = createStore();
  let objAtom: Value<object> | undefined = $value({});
  const detector1 = new LeakDetector(store.get(objAtom));
  let derivedAtom: Computed<object> | undefined = $computed((get) => ({
    obj: objAtom && get(objAtom),
  }));
  const detector2 = new LeakDetector(store.get(derivedAtom));
  let unsub: (() => void) | undefined = store.sub(
    objAtom,
    $func(() => {
      return;
    }),
  );
  unsub();
  unsub = undefined;
  objAtom = undefined;
  derivedAtom = undefined;
  expect(await detector1.isLeaking()).toBe(false);
  expect(await detector2.isLeaking()).toBe(false);
});

it('unsubscribe a long-lived base atom', async () => {
  const store = createStore();
  const base = $value({});
  let cmpt: Computed<object> | undefined = $computed((get) => ({
    obj: get(base),
  }));
  const detector = new LeakDetector(store.get(cmpt));
  let unsub: (() => void) | undefined = store.sub(
    base,
    $func(() => {
      return;
    }),
  );
  unsub();
  unsub = undefined;
  cmpt = undefined;
  expect(await detector.isLeaking()).toBe(false);
});

it('unsubscribe a computed atom', async () => {
  const store = createDebugStore();
  const base = $value({}, { debugLabel: 'base' });
  let cmpt: Computed<object> | undefined = $computed(
    (get) => ({
      obj: get(base),
    }),
    { debugLabel: 'cmpt' },
  );
  const detector = new LeakDetector(store.get(cmpt));
  let unsub: (() => void) | undefined = store.sub(
    cmpt,
    $func(() => {
      return;
    }),
  );

  unsub();
  unsub = undefined;
  cmpt = undefined;
  expect(await detector.isLeaking()).toBe(false);
});
