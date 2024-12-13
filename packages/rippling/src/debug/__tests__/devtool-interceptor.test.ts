import { expect, it, vi } from 'vitest';
import { setupDevtoolsInterceptor } from '../devtool-interceptor';
import { createDebugStore } from '../debug-store';
import { $computed, $func, $value } from '../../core';

it('send message through postMessage', () => {
  const trace = vi.fn();
  const window = {
    postMessage: trace,
  };

  const interceptor = setupDevtoolsInterceptor(window as unknown as Window);
  const store = createDebugStore(interceptor);
  const base$ = $value(0);
  store.set(base$, 1);
  expect(trace).toHaveBeenCalled();
});

it('convert keep simple object', () => {
  const trace = vi.fn();
  const window = {
    postMessage: trace,
  };

  const interceptor = setupDevtoolsInterceptor(window as unknown as Window);
  const store = createDebugStore(interceptor);
  const base$ = $value({
    foo: 'bar',
  });
  store.get(base$);
  expect(trace).toBeCalledTimes(2);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(trace.mock.calls[1][0].payload.data.data).toEqual({
    foo: 'bar',
  });
});

it('stringify function', () => {
  const trace = vi.fn();
  const window = {
    postMessage: trace,
  };

  const interceptor = setupDevtoolsInterceptor(window as unknown as Window);
  const store = createDebugStore(interceptor);
  const base$ = $value({
    foo: () => void 0,
  });
  store.get(base$);
  expect(trace).toBeCalledTimes(2);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(trace.mock.calls[1][0].payload.data.data).toEqual({
    foo: '[function]',
  });
});

it('stringify function 2', () => {
  const trace = vi.fn();
  const window = {
    postMessage: trace,
  };

  const interceptor = setupDevtoolsInterceptor(window as unknown as Window);
  const store = createDebugStore(interceptor);
  const base$ = $value(() => void 0);
  store.get(base$);
  expect(trace).toBeCalledTimes(2);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(trace.mock.calls[1][0].payload.data.data).toEqual('[function]');
});

it('intercept notify', () => {
  const trace = vi.fn();
  const window = {
    postMessage: trace,
  };

  const interceptor = setupDevtoolsInterceptor(window as unknown as Window);
  const store = createDebugStore(interceptor);
  const base$ = $value(0);
  store.sub(
    base$,
    $func(() => void 0, {
      debugLabel: 'callback$',
    }),
  );

  trace.mockClear();
  store.set(base$, 1);
  expect(trace).toBeCalled();
  expect(trace).toBeCalledTimes(4);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(trace.mock.calls[0][0].payload.type).toEqual('set');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(trace.mock.calls[1][0].payload.type).toEqual('notify');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(trace.mock.calls[2][0].payload.type).toEqual('notify');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(trace.mock.calls[3][0].payload.type).toEqual('set');
});

it('set should catch args', () => {
  const trace = vi.fn();
  const window = {
    postMessage: trace,
  };

  const interceptor = setupDevtoolsInterceptor(window as unknown as Window);
  const store = createDebugStore(interceptor);
  const base$ = $value(0);
  store.set(base$, 1);

  expect(trace).toBeCalledTimes(2);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(trace.mock.calls[1][0].payload.data.args).toEqual([1]);
});

it('stringify error', () => {
  const trace = vi.fn();
  const window = {
    postMessage: trace,
  };

  const interceptor = setupDevtoolsInterceptor(window as unknown as Window);
  const store = createDebugStore(interceptor);
  expect(() => {
    store.get(
      $computed(() => {
        throw new Error('foo');
      }),
    );
  }).toThrow('foo');
  expect(trace).toBeCalledTimes(2);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(trace.mock.calls[1][0].payload.data.error).toEqual('foo');
});
