// @vitest-environment happy-dom

import LeakDetector from 'jest-leak-detector';
import { expect, it } from 'vitest';
import { $value, createStore } from '../../core';
import type { Value } from '../../core';
import { useGet, StoreProvider } from '../';
import { cleanup, render } from '@testing-library/react';

it('should release memory after component unmount', async () => {
  const store = createStore();
  let base: Value<{ foo: string }> | undefined = $value({
    foo: 'bar',
  });

  const detector = new LeakDetector(store.get(base));

  function App() {
    const ret = useGet(base as Value<{ foo: string }>);
    return <div>{ret.foo}</div>;
  }

  render(
    <StoreProvider value={store}>
      <App />
    </StoreProvider>,
  );

  base = undefined;
  cleanup();

  expect(await detector.isLeaking()).toBe(false);
});
