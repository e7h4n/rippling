// @vitest-environment happy-dom
import '@testing-library/jest-dom/vitest';
import LeakDetector from 'jest-leak-detector';
import { fireEvent, render, cleanup, screen } from '@testing-library/vue';
import { expect, it } from 'vitest';
import { command, computed, createStore, state, type Computed } from '../../core';
import { provideStore } from '../provider';
import { useGet, useSet } from '..';

it('increments value on click', async () => {
  const count$ = state(0);

  const Component = {
    setup() {
      const count = useGet(count$);
      const setCount = useSet(count$);
      return { count, setCount };
    },
    template: `
    <div>
      <p>Times clicked: {{ count }}</p>
      <button @click="setCount((prev) => prev + 1)">increment</button>
    </div>
  `,
  };

  render({
    components: { Component },
    setup() {
      provideStore(createStore());
    },
    template: `<div><Component /></div>`,
  });

  expect(screen.getByText('Times clicked: 0')).toBeInTheDocument();

  const button = screen.getByText('increment');

  await fireEvent.click(button);
  await fireEvent.click(button);
  expect(screen.getByText('Times clicked: 2')).toBeInTheDocument();

  await fireEvent.click(button);
  expect(screen.getByText('Times clicked: 3')).toBeInTheDocument();
});

it('should release memory after view cleanup', async () => {
  let base$:
    | Computed<{
        foo: string;
      }>
    | undefined = computed(() => {
    return {
      foo: 'bar',
    };
  });

  const Component = {
    setup() {
      const base = useGet(
        base$ as Computed<{
          foo: string;
        }>,
      );
      return { foo: base.value.foo };
    },
    template: `
      <div>
        <p>foo: {{ foo }}</p>
      </div>
    `,
  };

  const store = createStore();
  const leakDetector = new LeakDetector(store.get(base$));
  render({
    components: { Component },
    setup() {
      provideStore(store);
    },
    template: `<div><Component /></div>`,
  });

  expect(screen.getByText('foo: bar')).toBeInTheDocument();

  base$ = undefined;
  cleanup();

  expect(await leakDetector.isLeaking()).toBe(false);
});

it('call command by useSet', async () => {
  const count$ = state(0);
  const increase$ = command(({ get, set }, count: number) => {
    set(count$, get(count$) + count);
  });

  const Component = {
    setup() {
      const count = useGet(count$);
      const increase = useSet(increase$);
      return { count, increase };
    },
    template: `
    <div>
      <p>Times clicked: {{ count }}</p>
      <button @click="increase(10)">increment</button>
    </div>
  `,
  };

  render({
    components: { Component },
    setup() {
      provideStore(createStore());
    },
    template: `<div><Component /></div>`,
  });

  expect(screen.getByText('Times clicked: 0')).toBeInTheDocument();

  const button = screen.getByText('increment');

  await fireEvent.click(button);
  await fireEvent.click(button);
  expect(screen.getByText('Times clicked: 20')).toBeInTheDocument();

  await fireEvent.click(button);
  expect(screen.getByText('Times clicked: 30')).toBeInTheDocument();
});

it('throw if can not find store', () => {
  const count$ = state(0);

  const Component = {
    setup() {
      const count = useGet(count$);
      return { count };
    },
    template: `
    <div>
      <p>{{ count }}</p>
    </div>
  `,
  };

  expect(() => {
    render({
      components: { Component },
      template: `<div><Component /></div>`,
    });
  }).toThrow();
});
