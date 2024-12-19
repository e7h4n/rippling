import { expect, it, vi } from 'vitest';
import { createDebugStore } from '../debug-store';
import { computed, command, state } from '../../core';
import { EventInterceptor } from '../event-interceptor';

it('should generate trace event with traceId', () => {
  const trace = vi.fn();
  const interceptor = new EventInterceptor();

  interceptor.addEventListener('get', (event) => {
    trace(event);
  });

  const store = createDebugStore(interceptor);
  const base$ = state(1, {
    debugLabel: 'base$',
  });
  store.get(base$);

  expect(trace).toBeCalledTimes(2);

  expect(trace.mock.calls[0][0]).toHaveProperty('type', 'get');
  expect(trace.mock.calls[0][0]).toHaveProperty('state', 'begin');
  expect(trace.mock.calls[0][0]).toHaveProperty('targetAtom', expect.stringContaining(':base$') as string);
  expect(trace.mock.calls[0][0]).toHaveProperty('time', expect.any(Number) as number);

  expect(trace.mock.calls[1][0]).toHaveProperty('type', 'get');
  expect(trace.mock.calls[1][0]).toHaveProperty('state', 'success');
  expect(trace.mock.calls[1][0]).toHaveProperty('result', 1);
  expect(trace.mock.calls[1][0]).toHaveProperty('time', expect.any(Number) as number);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(trace.mock.calls[0][0].eventId).toBe(trace.mock.calls[1][0].eventId);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  expect(trace.mock.calls[0][0].time).toBeLessThan(trace.mock.calls[1][0].time);
});

it('should catch get error', () => {
  const trace = vi.fn();
  const interceptor = new EventInterceptor();

  interceptor.addEventListener('get', (event) => {
    trace(event);
  });

  const derived$ = computed(
    () => {
      throw new Error('test');
    },
    {
      debugLabel: 'derived$',
    },
  );

  const store = createDebugStore(interceptor);
  expect(() => store.get(derived$)).toThrow('test');

  expect(trace).toHaveBeenCalledTimes(2);

  expect(trace.mock.calls[0][0]).toHaveProperty('type', 'get');
  expect(trace.mock.calls[0][0]).toHaveProperty('state', 'begin');
  expect(trace.mock.calls[0][0]).toHaveProperty('targetAtom', expect.stringContaining(':derived$') as string);

  expect(trace.mock.calls[1][0]).toHaveProperty('type', 'get');
  expect(trace.mock.calls[1][0]).toHaveProperty('state', 'error');
  expect(trace.mock.calls[1][0]).toHaveProperty('result', expect.any(Error) as Error);
  expect(trace.mock.calls[1][0]).toHaveProperty('time', expect.any(Number) as number);
});

it('set event', () => {
  const trace = vi.fn();
  const interceptor = new EventInterceptor();

  interceptor.addEventListener('set', (event) => {
    trace(event);
  });

  const store = createDebugStore(interceptor);
  const base$ = state(1);
  store.set(base$, 3);

  expect(trace).toBeCalledTimes(2);

  expect(trace.mock.calls[0][0]).toHaveProperty('type', 'set');
  expect(trace.mock.calls[0][0]).toHaveProperty('state', 'begin');
  expect(trace.mock.calls[0][0]).toHaveProperty('args', [3]);
  expect(trace.mock.calls[1][0]).toHaveProperty('type', 'set');
  expect(trace.mock.calls[1][0]).toHaveProperty('state', 'success');
  expect(trace.mock.calls[1][0]).toHaveProperty('result', undefined);
  expect(trace.mock.calls[1][0]).toHaveProperty('time', expect.any(Number) as number);
  expect(trace.mock.calls[1][0]).toHaveProperty('args', [3]);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(trace.mock.calls[0][0].eventId).toBe(trace.mock.calls[1][0].eventId);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  expect(trace.mock.calls[0][0].time).toBeLessThan(trace.mock.calls[1][0].time);
});

it('set event with error', () => {
  const trace = vi.fn();
  const interceptor = new EventInterceptor();

  interceptor.addEventListener('set', (event) => {
    trace(event);
  });

  const store = createDebugStore(interceptor);
  const fn$ = command((_, val: number) => {
    throw new Error('test' + String(val));
  });
  expect(() => store.set(fn$, 3)).toThrow('test3');

  expect(trace).toBeCalledTimes(2);

  expect(trace.mock.calls[0][0]).toHaveProperty('type', 'set');
  expect(trace.mock.calls[0][0]).toHaveProperty('state', 'begin');
  expect(trace.mock.calls[0][0]).toHaveProperty('args', [3]);
  expect(trace.mock.calls[1][0]).toHaveProperty('type', 'set');
  expect(trace.mock.calls[1][0]).toHaveProperty('state', 'error');
  expect(trace.mock.calls[1][0]).toHaveProperty('result', expect.any(Error) as Error);
  expect(trace.mock.calls[1][0]).toHaveProperty('time', expect.any(Number) as number);
  expect(trace.mock.calls[1][0]).toHaveProperty('args', [3]);
});

it('sub event', () => {
  const trace = vi.fn();
  const interceptor = new EventInterceptor();

  interceptor.addEventListener('sub', (event) => {
    trace(event);
  });

  const store = createDebugStore(interceptor);
  const base$ = state(1);
  store.sub(
    base$,
    command(() => void 0, {
      debugLabel: 'callback',
    }),
  );

  expect(trace).toBeCalledTimes(2);

  expect(trace.mock.calls[0][0]).toHaveProperty('type', 'sub');
  expect(trace.mock.calls[0][0]).toHaveProperty('state', 'begin');
  expect(trace.mock.calls[0][0]).toHaveProperty('args', [expect.stringContaining(':callback') as string]);
  expect(trace.mock.calls[1][0]).toHaveProperty('type', 'sub');
  expect(trace.mock.calls[1][0]).toHaveProperty('state', 'success');
  expect(trace.mock.calls[1][0]).toHaveProperty('args', [expect.stringContaining(':callback') as string]);
  expect(trace.mock.calls[1][0]).toHaveProperty('result', undefined);
  expect(trace.mock.calls[1][0]).toHaveProperty('time', expect.any(Number) as number);
});

it('unsub event', () => {
  const trace = vi.fn();
  const interceptor = new EventInterceptor();

  interceptor.addEventListener('unsub', (event) => {
    trace(event);
  });

  const store = createDebugStore(interceptor);
  const base$ = state(1);
  store.sub(
    base$,
    command(() => void 0, {
      debugLabel: 'callback',
    }),
  )();

  expect(trace).toBeCalledTimes(2);

  expect(trace.mock.calls[0][0]).toHaveProperty('state', 'begin');
  expect(trace.mock.calls[0][0]).toHaveProperty('type', 'unsub');
  expect(trace.mock.calls[1][0]).toHaveProperty('state', 'success');
});

it('mount event', () => {
  const trace = vi.fn();
  const interceptor = new EventInterceptor();

  interceptor.addEventListener('mount', (event) => {
    trace(event.type, event.eventId, event.targetAtom, event.time);
  });

  const base$ = state(1, {
    debugLabel: 'base$',
  });
  const derived$ = computed((get) => get(base$), {
    debugLabel: 'derived$',
  });

  const store = createDebugStore(interceptor);
  store.sub(
    derived$,
    command(() => void 0),
  );

  expect(trace).toBeCalledTimes(2);

  expect(trace).toHaveBeenNthCalledWith(
    1,
    'mount',
    expect.any(Number),
    expect.stringContaining(':derived$'),
    expect.any(Number) as number,
  );
  expect(trace).toHaveBeenNthCalledWith(
    2,
    'mount',
    expect.any(Number),
    expect.stringContaining(':base$'),
    expect.any(Number) as number,
  );
});

it('unmount event', () => {
  const trace = vi.fn();
  const interceptor = new EventInterceptor();

  interceptor.addEventListener('unmount', (event) => {
    trace(event.type, event.eventId, event.targetAtom, event.time);
  });

  const base$ = state(1, {
    debugLabel: 'base$',
  });
  const derived$ = computed((get) => get(base$), {
    debugLabel: 'derived$',
  });

  const store = createDebugStore(interceptor);
  store.sub(
    derived$,
    command(() => void 0),
  )();

  expect(trace).toBeCalledTimes(2);

  expect(trace).toHaveBeenNthCalledWith(
    1,
    'unmount',
    expect.any(Number),
    expect.stringContaining(':derived$'),
    expect.any(Number) as number,
  );
  expect(trace).toHaveBeenNthCalledWith(
    2,
    'unmount',
    expect.any(Number),
    expect.stringContaining(':base$'),
    expect.any(Number) as number,
  );
});

it('use remove event listener can stop listening', () => {
  const interceptor = new EventInterceptor();

  const callback = vi.fn();
  interceptor.addEventListener('get', callback);

  const store = createDebugStore(interceptor);
  const base$ = state(1);
  store.get(base$);

  expect(callback).toBeCalledTimes(2);

  interceptor.removeEventListener('get', callback);
  store.get(base$);

  expect(callback).toBeCalledTimes(2);
});

it('use signal abort listener', () => {
  const interceptor = new EventInterceptor();

  const callback = vi.fn();
  const controller = new AbortController();
  interceptor.addEventListener('get', callback, {
    signal: controller.signal,
  });

  const store = createDebugStore(interceptor);
  const base$ = state(1);
  store.get(base$);

  expect(callback).toBeCalledTimes(2);

  controller.abort();
  store.get(base$);

  expect(callback).toBeCalledTimes(2);
});
