import { expect, it, vi } from 'vitest';
import { setupDevtoolsInterceptor } from '../devtool-interceptor';
import { createDebugStore } from '../debug-store';
import { computed, command, state } from '../../core';

it('send message through postMessage', () => {
  const trace = vi.fn();
  const window = {
    postMessage: trace,
    addEventListener: vi.fn(),
  };

  const interceptor = setupDevtoolsInterceptor(window as unknown as Window);
  const store = createDebugStore(interceptor);
  const base$ = state(0);
  store.set(base$, 1);
  expect(trace).toHaveBeenCalled();
});

it('convert keep simple object', () => {
  const trace = vi.fn();
  const window = {
    postMessage: trace,
    addEventListener: vi.fn(),
  };

  const interceptor = setupDevtoolsInterceptor(window as unknown as Window);
  const store = createDebugStore(interceptor);
  const base$ = state({
    foo: 'bar',
  });
  store.get(base$);
  expect(trace).toBeCalledTimes(2);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(trace.mock.calls[1][0].payload.state).toEqual('success');
});

it('intercept notify', () => {
  const trace = vi.fn();
  const window = {
    postMessage: trace,
    addEventListener: vi.fn(),
  };

  const interceptor = setupDevtoolsInterceptor(window as unknown as Window);
  const store = createDebugStore(interceptor);
  const base$ = state(0);
  store.sub(
    base$,
    command(() => void 0, {
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
    addEventListener: vi.fn(),
  };

  const interceptor = setupDevtoolsInterceptor(window as unknown as Window);
  const store = createDebugStore(interceptor);
  const base$ = state(0);
  store.set(base$, 1);

  expect(trace).toBeCalledTimes(2);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(trace.mock.calls[1][0].payload.state).toEqual('success');
});

it('stringify error', () => {
  const trace = vi.fn();
  const window = {
    postMessage: trace,
    addEventListener: vi.fn(),
  };

  const interceptor = setupDevtoolsInterceptor(window as unknown as Window);
  const store = createDebugStore(interceptor);
  expect(() => {
    store.get(
      computed(() => {
        throw new Error('foo');
      }),
    );
  }).toThrow('foo');
  expect(trace).toBeCalledTimes(4); // two for get, two for computed

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(trace.mock.calls[2][0].payload.state).toEqual('error');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(trace.mock.calls[3][0].payload.state).toEqual('error');
});

it('log specified event to console', () => {
  const eventTarget = new EventTarget();

  const interceptor = setupDevtoolsInterceptor({
    postMessage: vi.fn(),
    addEventListener: eventTarget.addEventListener.bind(eventTarget),
  } as unknown as Window);
  const store = createDebugStore(interceptor);

  const message = new MessageEvent('message', {
    data: {
      source: 'ccstate-devtools',
      payload: {
        type: 'command',
        command: 'watch',
        args: ['base$'],
      },
    },
  });
  eventTarget.dispatchEvent(message);

  vi.spyOn(console, 'group').mockImplementation(() => void 0);
  vi.spyOn(console, 'log').mockImplementation(() => void 0);

  store.set(
    state(0, {
      debugLabel: 'base$',
    }),
    1,
  );
  store.get(state(0, { debugLabel: 'base$' }));
  store.sub(
    state(0, { debugLabel: 'base$' }),
    command(() => void 0),
  );

  expect(console.group).toBeCalledTimes(7);
  expect(console.log).toBeCalledTimes(14);
});

it('filter out invalid message', () => {
  const eventTarget = new EventTarget();

  setupDevtoolsInterceptor({
    postMessage: vi.fn(),
    addEventListener: eventTarget.addEventListener.bind(eventTarget),
  } as unknown as Window);

  expect(() => {
    eventTarget.dispatchEvent(new MessageEvent('message'));
  }).not.toThrow();

  expect(() => {
    eventTarget.dispatchEvent(
      new MessageEvent('message', {
        data: 'haha',
      }),
    );
  }).not.toThrow();
});
