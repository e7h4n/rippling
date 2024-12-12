import { expect, it, vi } from 'vitest';
import { setupDevtoolsInterceptor } from '../devtool-interceptor';
import { createDebugStore } from '../debug-store';
import { $value } from '../../core';

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
