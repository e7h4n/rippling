import { bench, describe } from 'vitest';
import { setupStore, setupStoreWithoutSub } from './case';
import type { State } from '../src';
import type { PrimitiveAtom } from 'jotai/vanilla';
import { ccstateStrategy } from './strategy/ccstate';
import { jotaiStrategy } from './strategy/jotai';
import { signalStrategy } from './strategy/signals';

const isCI = typeof window === 'undefined' ? !!process.env.CI : false;

describe('set with subscription', () => {
  const PROP_GRAPH_DEPTH = 4;
  describe(`set with mount, ${String(PROP_GRAPH_DEPTH)} layer states, each computed has 10 children`, () => {
    const { atoms: atomsCCState, store: storeCCState } = setupStore(PROP_GRAPH_DEPTH, ccstateStrategy);
    bench('ccstate', () => {
      const atoms = atomsCCState;
      const store = storeCCState;
      for (let i = 0; i < atoms[0].length / 10; i++) {
        const idx = Math.floor(Math.random() * atoms[0].length);
        store.set(atoms[0][idx] as State<number>, (x) => x + 1);
      }
    });

    const { atoms: atomsJotai, store: storeJotai } = setupStore(PROP_GRAPH_DEPTH, jotaiStrategy);
    bench.skipIf(isCI)('jotai', () => {
      const atoms = atomsJotai;
      const store = storeJotai;
      for (let i = 0; i < atoms[0].length / 10; i++) {
        const idx = Math.floor(Math.random() * atoms[0].length);
        store.set(atoms[0][idx] as PrimitiveAtom<number>, (x) => x + 1);
      }
    });

    const { atoms: signals } = setupStore(PROP_GRAPH_DEPTH, signalStrategy);
    bench.skipIf(isCI).skip('signals', () => {
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
    const { store: storeWithoutSubCCState, atoms: atomsWithoutSubCCState } = setupStoreWithoutSub(
      PROP_GRAPH_DEPTH,
      ccstateStrategy,
    );
    bench('ccstate', () => {
      const atoms = atomsWithoutSubCCState;
      const store = storeWithoutSubCCState;
      for (let i = 0; i < atoms[0].length / 10; i++) {
        const idx = Math.floor(Math.random() * atoms[0].length);
        store.set(atoms[0][idx] as State<number>, (x) => x + 1);
      }
    });

    const { store: storeWithoutSubJotai, atoms: atomsWithoutSubJotai } = setupStoreWithoutSub(
      PROP_GRAPH_DEPTH,
      jotaiStrategy,
    );
    bench.skipIf(isCI)('jotai', () => {
      const atoms = atomsWithoutSubJotai;
      const store = storeWithoutSubJotai;
      for (let i = 0; i < atoms[0].length / 10; i++) {
        const idx = Math.floor(Math.random() * atoms[0].length);
        store.set(atoms[0][idx] as PrimitiveAtom<number>, (x) => x + 1);
      }
    });

    const { atoms: signals } = setupStoreWithoutSub(PROP_GRAPH_DEPTH, signalStrategy);
    bench.skipIf(isCI).skip('signals', () => {
      for (let i = 0; i < signals[0].length / 10; i++) {
        const idx = Math.floor(Math.random() * signals[0].length);
        const signal = signals[0][idx];
        signal.value = signal.value + 1;
      }
    });
  });
});
