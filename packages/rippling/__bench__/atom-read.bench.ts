import { bench, describe } from 'vitest';
import { setupStore, setupStoreWithoutSub } from './case';
import type { Value } from '../src';
import type { PrimitiveAtom } from 'jotai/vanilla';
import { ripplingStrategy } from './strategy/rippling';
import { jotaiStrategy } from './strategy/jotai';
import { signalStrategy } from './strategy/signals';

describe('set with subscription', () => {
  const PROP_GRAPH_DEPTH = 4;
  describe(`set with mount, ${String(PROP_GRAPH_DEPTH)} layer states, each computed has 10 children`, () => {
    const { atoms: atomsRippling, store: storeRippling } = setupStore(PROP_GRAPH_DEPTH, ripplingStrategy);
    bench('rippling', () => {
      const atoms = atomsRippling;
      const store = storeRippling;
      for (let i = 0; i < atoms[0].length / 10; i++) {
        const idx = Math.floor(Math.random() * atoms[0].length);
        store.set(atoms[0][idx] as Value<number>, (x) => x + 1);
      }
    });

    const { atoms: atomsJotai, store: storeJotai } = setupStore(PROP_GRAPH_DEPTH, jotaiStrategy);
    bench.skipIf(!!process.env.CI)('jotai', () => {
      const atoms = atomsJotai;
      const store = storeJotai;
      for (let i = 0; i < atoms[0].length / 10; i++) {
        const idx = Math.floor(Math.random() * atoms[0].length);
        store.set(atoms[0][idx] as PrimitiveAtom<number>, (x) => x + 1);
      }
    });

    const { atoms: signals } = setupStore(PROP_GRAPH_DEPTH, signalStrategy);
    bench.skipIf(!!process.env.CI)('signals', () => {
      for (let i = 0; i < signals[0].length / 10; i++) {
        const idx = Math.floor(Math.random() * signals[0].length);
        const signal = signals[0][idx];
        signal.value = signal.value + 1;
      }
    });
  });
});

describe('set without sub', () => {
  const PROP_GRAPH_DEPTH = 3;

  describe(`set without sub, ${String(PROP_GRAPH_DEPTH)} layer states, each computed has 10 children`, () => {
    const { store: storeWithoutSubRippling, atoms: atomsWithoutSubRippling } = setupStoreWithoutSub(
      PROP_GRAPH_DEPTH,
      ripplingStrategy,
    );
    bench('rippling', () => {
      const atoms = atomsWithoutSubRippling;
      const store = storeWithoutSubRippling;
      for (let i = 0; i < atoms[0].length / 10; i++) {
        const idx = Math.floor(Math.random() * atoms[0].length);
        store.set(atoms[0][idx] as Value<number>, (x) => x + 1);
      }
    });

    const { store: storeWithoutSubJotai, atoms: atomsWithoutSubJotai } = setupStoreWithoutSub(
      PROP_GRAPH_DEPTH,
      jotaiStrategy,
    );
    bench.skipIf(!!process.env.CI)('jotai', () => {
      const atoms = atomsWithoutSubJotai;
      const store = storeWithoutSubJotai;
      for (let i = 0; i < atoms[0].length / 10; i++) {
        const idx = Math.floor(Math.random() * atoms[0].length);
        store.set(atoms[0][idx] as PrimitiveAtom<number>, (x) => x + 1);
      }
    });

    const { atoms: signals } = setupStoreWithoutSub(PROP_GRAPH_DEPTH, signalStrategy);
    bench.skipIf(!!process.env.CI)('signals', () => {
      for (let i = 0; i < signals[0].length / 10; i++) {
        const idx = Math.floor(Math.random() * signals[0].length);
        const signal = signals[0][idx];
        signal.value = signal.value + 1;
      }
    });
  });
});
