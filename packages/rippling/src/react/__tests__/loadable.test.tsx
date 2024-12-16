// @vitest-environment happy-dom

import '@testing-library/jest-dom/vitest';
import { render, cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { $computed, createStore, $value } from '../../core';
import type { Computed, Value } from '../../core';
import { StrictMode, useEffect, version as reactVersion, Suspense } from 'react';
import { StoreProvider, useGet, useSet, useLoadable } from '..';
import { delay } from 'signal-timers';
import { useLastLoadable } from '../useLoadable';

const IS_REACT18 = reactVersion.startsWith('18.');

afterEach(() => {
  cleanup();
});

function makeDefered<T>(): {
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
  promise: Promise<T>;
} {
  const deferred: {
    resolve: (value: T) => void;
    reject: (error: unknown) => void;
    promise: Promise<T>;
  } = {} as {
    resolve: (value: T) => void;
    reject: (error: unknown) => void;
    promise: Promise<T>;
  };

  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return deferred;
}

it('convert promise to loadable', async () => {
  const base = $value(Promise.resolve('foo'));
  const App = () => {
    const ret = useLoadable(base);
    if (ret.state === 'loading' || ret.state === 'hasError') {
      return <div>loading</div>;
    }
    return <div>{ret.data}</div>;
  };
  const store = createStore();
  render(
    <StoreProvider value={store}>
      <App />
    </StoreProvider>,
    { wrapper: StrictMode },
  );

  expect(screen.getByText('loading')).toBeTruthy();
  expect(await screen.findByText('foo')).toBeTruthy();
});

it('reset promise atom will reset loadable', async () => {
  const base = $value(Promise.resolve('foo'));
  const App = () => {
    const ret = useLoadable(base);
    if (ret.state === 'loading' || ret.state === 'hasError') {
      return <div>loading</div>;
    }
    return <div>{ret.data}</div>;
  };
  const store = createStore();
  render(
    <StoreProvider value={store}>
      <App />
    </StoreProvider>,
    { wrapper: StrictMode },
  );

  expect(await screen.findByText('foo')).toBeTruthy();

  const [, promise] = (() => {
    let ret;
    const promise = new Promise((r) => (ret = r));
    return [ret, promise];
  })();

  store.set(base, promise);
  expect(await screen.findByText('loading')).toBeTruthy();
});

it('switchMap', async () => {
  const base = $value(Promise.resolve('foo'));
  const App = () => {
    const ret = useLoadable(base);
    if (ret.state === 'loading' || ret.state === 'hasError') {
      return <div>loading</div>;
    }
    return <div>{ret.data}</div>;
  };
  const store = createStore();
  render(
    <StoreProvider value={store}>
      <App />
    </StoreProvider>,
    { wrapper: StrictMode },
  );

  expect(await screen.findByText('foo')).toBeTruthy();

  const defered = makeDefered();

  store.set(base, defered.promise);
  expect(await screen.findByText('loading')).toBeTruthy();

  store.set(base, Promise.resolve('bar'));
  expect(await screen.findByText('bar')).toBeTruthy();

  defered.resolve('baz');
  await delay(0);
  expect(() => screen.getByText('baz')).toThrow();
});

it('loadable turns suspense into values', async () => {
  let resolve: (x: number) => void = () => void 0;
  const asyncAtom = $computed(() => {
    return new Promise<number>((r) => (resolve = r));
  });

  const store = createStore();
  render(
    <StrictMode>
      <StoreProvider value={store}>
        <LoadableComponent asyncAtom={asyncAtom} />
      </StoreProvider>
    </StrictMode>,
  );

  await screen.findByText('Loading...');
  resolve(5);
  await screen.findByText('Data: 5');
});

it('loadable turns errors into values', async () => {
  const deferred = makeDefered<number>();

  const asyncAtom = $value(deferred.promise);

  const store = createStore();
  render(
    <StrictMode>
      <StoreProvider value={store}>
        <LoadableComponent asyncAtom={asyncAtom} />
      </StoreProvider>
    </StrictMode>,
  );

  await screen.findByText('Loading...');
  deferred.reject(new Error('An error occurred'));
  await screen.findByText('Error: An error occurred');
});

it('loadable turns primitive throws into values', async () => {
  const deferred = makeDefered<number>();

  const asyncAtom = $value(deferred.promise);

  const store = createStore();
  render(
    <StrictMode>
      <StoreProvider value={store}>
        <LoadableComponent asyncAtom={asyncAtom} />
      </StoreProvider>
    </StrictMode>,
  );

  await screen.findByText('Loading...');
  deferred.reject('An error occurred');
  await screen.findByText('An error occurred');
});

it('loadable goes back to loading after re-fetch', async () => {
  let resolve: (x: number) => void = () => void 0;
  const refreshAtom = $value(0);
  const asyncAtom = $computed((get) => {
    get(refreshAtom);
    return new Promise<number>((r) => (resolve = r));
  });

  const Refresh = () => {
    const setRefresh = useSet(refreshAtom);
    return (
      <>
        <button
          onClick={() => {
            setRefresh((value) => {
              return value + 1;
            });
          }}
        >
          refresh
        </button>
      </>
    );
  };

  const store = createStore();
  render(
    <StrictMode>
      <StoreProvider value={store}>
        <Refresh />
        <LoadableComponent asyncAtom={asyncAtom} />
      </StoreProvider>
    </StrictMode>,
  );

  screen.getByText('Loading...');
  resolve(5);
  await screen.findByText('Data: 5');
  await userEvent.click(screen.getByText('refresh'));
  await screen.findByText('Loading...');
  resolve(6);
  await screen.findByText('Data: 6');
});

it('loadable can recover from error', async () => {
  let resolve: (x: number) => void = () => void 0;
  let reject: (error: unknown) => void = () => void 0;
  const refreshAtom = $value(0);
  const asyncAtom = $computed((get) => {
    get(refreshAtom);
    return new Promise<number>((res, rej) => {
      resolve = res;
      reject = rej;
    });
  });

  const Refresh = () => {
    const setRefresh = useSet(refreshAtom);
    return (
      <>
        <button
          onClick={() => {
            setRefresh((value) => value + 1);
          }}
        >
          refresh
        </button>
      </>
    );
  };

  const store = createStore();
  render(
    <StrictMode>
      <StoreProvider value={store}>
        <Refresh />
        <LoadableComponent asyncAtom={asyncAtom} />
      </StoreProvider>
    </StrictMode>,
  );

  screen.getByText('Loading...');
  reject(new Error('An error occurred'));
  await screen.findByText('Error: An error occurred');
  await userEvent.click(screen.getByText('refresh'));
  await screen.findByText('Loading...');
  resolve(6);
  await screen.findByText('Data: 6');
});

// sync atom is not supported in Rippling
it.skip('loadable immediately resolves sync values', () => {
  // const syncAtom = $value(5);
  const effectCallback = vi.fn();

  const store = createStore();
  render(
    <StrictMode>
      <StoreProvider value={store}>
        {/* this line will trigger type error until useLoadable supports sync atom */}
        {/* <LoadableComponent effectCallback={effectCallback} asyncAtom={syncAtom} /> */}
      </StoreProvider>
    </StrictMode>,
  );

  screen.getByText('Data: 5');
  expect(effectCallback.mock.calls).not.toContain(expect.objectContaining({ state: 'loading' }));
  expect(effectCallback).toHaveBeenLastCalledWith({
    state: 'hasData',
    data: 5,
  });
});

// Suspense is not supported in Rippling
it.skip('loadable can use resolved promises synchronously', async () => {
  const asyncAtom = $value(Promise.resolve(5));
  const effectCallback = vi.fn();

  const ResolveAtomComponent = () => {
    void useGet(asyncAtom);

    return <div>Ready</div>;
  };

  const store = createStore();
  const { rerender } = await Promise.resolve(
    render(
      <StrictMode>
        <StoreProvider value={store}>
          <Suspense fallback="loading">
            <ResolveAtomComponent />
          </Suspense>
        </StoreProvider>
      </StrictMode>,
    ),
  );

  if (IS_REACT18) {
    await screen.findByText('loading');
    // FIXME React 18 Suspense does not show "Ready"
  } else {
    await screen.findByText('Ready');
  }

  rerender(
    <StrictMode>
      <LoadableComponent effectCallback={effectCallback} asyncAtom={asyncAtom} />
    </StrictMode>,
  );
  await screen.findByText('Data: 5');

  expect(effectCallback.mock.calls).not.toContain(expect.objectContaining({ state: 'loading' }));
  expect(effectCallback).toHaveBeenLastCalledWith({
    state: 'hasData',
    data: 5,
  });
});

it('loadable of a derived async atom does not trigger infinite loop (#1114)', async () => {
  let resolve: (x: number) => void = () => void 0;
  const baseAtom = $value(0);
  const asyncAtom = $computed((get) => {
    get(baseAtom);
    return new Promise<number>((r) => (resolve = r));
  });

  const Trigger = () => {
    const trigger = useSet(baseAtom);
    return (
      <>
        <button
          onClick={() => {
            trigger((value) => value);
          }}
        >
          trigger
        </button>
      </>
    );
  };

  const store = createStore();
  render(
    <StrictMode>
      <StoreProvider value={store}>
        <Trigger />
        <LoadableComponent asyncAtom={asyncAtom} />
      </StoreProvider>
    </StrictMode>,
  );

  screen.getByText('Loading...');
  await userEvent.click(screen.getByText('trigger'));
  resolve(5);
  await screen.findByText('Data: 5');
});

it('loadable of a derived async atom with error does not trigger infinite loop (#1330)', async () => {
  const baseAtom = $computed(() => {
    throw new Error('thrown in baseAtom');
  });
  // eslint-disable-next-line @typescript-eslint/require-await
  const asyncAtom = $computed(async (get) => {
    get(baseAtom);
    return '';
  });

  const store = createStore();
  render(
    <StrictMode>
      <StoreProvider value={store}>
        <LoadableComponent asyncAtom={asyncAtom} />
      </StoreProvider>
    </StrictMode>,
  );

  screen.getByText('Loading...');
  await screen.findByText('Error: thrown in baseAtom');
});

it('does not repeatedly attempt to get the value of an unresolved promise atom wrapped in a loadable (#1481)', async () => {
  const baseAtom = $value(new Promise<number>(() => void 0));

  let callsToGetBaseAtom = 0;
  const derivedAtom = $computed((get) => {
    callsToGetBaseAtom++;
    return get(baseAtom);
  });

  const store = createStore();
  render(
    <StrictMode>
      <StoreProvider value={store}>
        <LoadableComponent asyncAtom={derivedAtom} />
      </StoreProvider>
    </StrictMode>,
  );

  // we need a small delay to reproduce the issue
  await new Promise((r) => setTimeout(r, 10));
  // depending on provider-less mode or versioned-write mode, there will be
  // either 2 or 3 calls.
  expect(callsToGetBaseAtom).toBeLessThanOrEqual(3);
});

// sync atom is not supported in Rippling
it.skip('should handle sync error (#1843)', async () => {
  const syncAtom = $computed(() => {
    throw new Error('thrown in syncAtom');
  });

  const store = createStore();
  render(
    <StrictMode>
      <StoreProvider value={store}>
        <LoadableComponent asyncAtom={syncAtom} />
      </StoreProvider>
    </StrictMode>,
  );

  await screen.findByText('Error: thrown in syncAtom');
});

it('should handle async error', async () => {
  // eslint-disable-next-line @typescript-eslint/require-await
  const syncAtom = $computed(async () => {
    throw new Error('thrown in syncAtom');
  });

  const store = createStore();
  render(
    <StrictMode>
      <StoreProvider value={store}>
        <LoadableComponent asyncAtom={syncAtom} />
      </StoreProvider>
    </StrictMode>,
  );

  await screen.findByText('Error: thrown in syncAtom');
});

interface LoadableComponentProps {
  asyncAtom: Value<Promise<number | string>> | Computed<Promise<number | string>>;
  effectCallback?: (loadableValue: unknown) => void;
}

const LoadableComponent = ({ asyncAtom, effectCallback }: LoadableComponentProps) => {
  const value = useLoadable(asyncAtom);

  useEffect(() => {
    if (effectCallback) {
      effectCallback(value);
    }
  }, [value, effectCallback]);

  if (value.state === 'loading') {
    return <>Loading...</>;
  }

  if (value.state === 'hasError') {
    return <>{String(value.error)}</>;
  }

  // this is to ensure correct typing
  const data: number | string = value.data;

  return <>Data: {data}</>;
};

it('use lastLoadable should not update when new promise pending', async () => {
  const async$ = $value(Promise.resolve(1));

  const store = createStore();
  function App() {
    const number = useLastLoadable(async$);
    if (number.state !== 'hasData') {
      return <div>loading</div>;
    }
    return <div>num{number.data}</div>;
  }

  render(
    <StoreProvider value={store}>
      <App />
    </StoreProvider>,
  );

  expect(await screen.findByText('num1')).toBeInTheDocument();

  const defered = makeDefered();
  store.set(async$, defered.promise);

  await delay(0);
  expect(screen.getByText('num1')).toBeInTheDocument(); // keep num1 instead 'Loading...'
  defered.resolve(2);
  await delay(0);
  expect(screen.getByText('num2')).toBeInTheDocument();
});
