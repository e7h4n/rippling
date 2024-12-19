import { expect, it } from 'vitest';
import { computed, command, state } from '..';

it('creates atoms', () => {
  // primitive atom
  const countAtom = state(0);
  const anotherCountAtom = state(1);
  // read-only derived atom
  const doubledCountAtom = computed((get) => get(countAtom) * 2);
  // read-write derived atom
  const sumAtom = computed((get) => get(countAtom) + get(anotherCountAtom));

  const setSumAtom = command(({ get, set }, num: number) => {
    set(countAtom, get(countAtom) + num / 2);
    set(anotherCountAtom, get(anotherCountAtom) + num / 2);
  });

  // write-only derived atom
  const decrementCountAtom = command(({ get, set }) => {
    set(countAtom, get(countAtom) - 1);
  });

  expect(countAtom).toHaveProperty('init', 0);
  expect(doubledCountAtom).toHaveProperty('read');
  expect(setSumAtom).toHaveProperty('write');
  expect(decrementCountAtom).toHaveProperty('write');
  expect(sumAtom).toHaveProperty('read');
});
