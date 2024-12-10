import { expect, it, vi } from 'vitest';
import { createDebugStore } from '../debug-store';
import { $computed, $func, $value } from '../../core';
import { EventInterceptor } from '../event-interceptor';

it('should generate trace event with traceId', () => {
  const trace = vi.fn();
  const interceptor = new EventInterceptor();

  interceptor.addEventListener('get', (event) => {
    trace(event.eventId, event.targetAtom, event.data);
  });

  const store = createDebugStore(interceptor);
  const base$ = $value(1);
  store.get(base$);

  expect(trace).toBeCalledTimes(2);

  expect(trace).toHaveBeenNthCalledWith(1, expect.any(Number), expect.any(String), {
    state: 'begin',
    beginTime: expect.any(Number) as number,
  });
  expect(trace).toHaveBeenNthCalledWith(2, expect.any(Number), expect.any(String), {
    state: 'hasData',
    data: 1,
    beginTime: expect.any(Number) as number,
    endTime: expect.any(Number) as number,
  });
  expect(trace.mock.calls[0][0]).toBe(trace.mock.calls[1][0]);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  expect(trace.mock.calls[1][2].beginTime).toBeLessThan(trace.mock.calls[1][2].endTime);
});

it('should catch get error', () => {
  const trace = vi.fn();
  const interceptor = new EventInterceptor();

  interceptor.addEventListener('get', (event) => {
    trace(event.eventId, event.targetAtom, event.data);
  });

  const derived$ = $computed(() => {
    throw new Error('test');
  });

  const store = createDebugStore(interceptor);
  expect(() => store.get(derived$)).toThrow('test');

  expect(trace).toHaveBeenCalledTimes(2);
  expect(trace).toHaveBeenNthCalledWith(1, expect.any(Number), expect.any(String), {
    state: 'begin',
    beginTime: expect.any(Number) as number,
  });
  expect(trace).toHaveBeenNthCalledWith(2, expect.any(Number), expect.any(String), {
    state: 'hasError',
    error: expect.any(Error) as Error,
    beginTime: expect.any(Number) as number,
    endTime: expect.any(Number) as number,
  });
});

it('set event', () => {
  const trace = vi.fn();
  const interceptor = new EventInterceptor();

  interceptor.addEventListener('set', (event) => {
    trace(event.type, event.eventId, event.targetAtom, event.data);
  });

  const store = createDebugStore(interceptor);
  const base$ = $value(1);
  store.set(base$, 3);

  expect(trace).toBeCalledTimes(2);

  expect(trace).toHaveBeenNthCalledWith(1, 'set', expect.any(Number), expect.any(String), {
    state: 'begin',
    beginTime: expect.any(Number) as number,
    args: [3],
  });
  expect(trace).toHaveBeenNthCalledWith(2, 'set', expect.any(Number), expect.any(String), {
    state: 'hasData',
    data: undefined,
    beginTime: expect.any(Number) as number,
    endTime: expect.any(Number) as number,
    args: [3],
  });
  expect(trace.mock.calls[0][0]).toBe(trace.mock.calls[1][0]);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  expect(trace.mock.calls[1][3].beginTime).toBeLessThan(trace.mock.calls[1][3].endTime);
});

it('set event with error', () => {
  const trace = vi.fn();
  const interceptor = new EventInterceptor();

  interceptor.addEventListener('set', (event) => {
    trace(event.type, event.eventId, event.targetAtom, event.data);
  });

  const store = createDebugStore(interceptor);
  const fn$ = $func((_, val: number) => {
    throw new Error('test' + String(val));
  });
  expect(() => store.set(fn$, 3)).toThrow('test3');

  expect(trace).toBeCalledTimes(2);

  expect(trace).toHaveBeenNthCalledWith(1, 'set', expect.any(Number), expect.any(String), {
    state: 'begin',
    beginTime: expect.any(Number) as number,
    args: [3],
  });
  expect(trace).toHaveBeenNthCalledWith(2, 'set', expect.any(Number), expect.any(String), {
    state: 'hasError',
    error: expect.any(Error) as Error,
    beginTime: expect.any(Number) as number,
    endTime: expect.any(Number) as number,
    args: [3],
  });
});

it('sub event', () => {
  const trace = vi.fn();
  const interceptor = new EventInterceptor();

  interceptor.addEventListener('sub', (event) => {
    trace(event.type, event.eventId, event.targetAtom, event.data);
  });

  const store = createDebugStore(interceptor);
  const base$ = $value(1);
  store.sub(
    base$,
    $func(() => void 0, {
      debugLabel: 'callback',
    }),
  );

  expect(trace).toBeCalledTimes(2);

  expect(trace).toHaveBeenNthCalledWith(1, 'sub', expect.any(Number), expect.any(String), {
    state: 'begin',
    beginTime: expect.any(Number) as number,
    callback: expect.stringContaining(':callback') as string,
  });
  expect(trace).toHaveBeenNthCalledWith(2, 'sub', expect.any(Number), expect.any(String), {
    state: 'end',
    beginTime: expect.any(Number) as number,
    callback: expect.stringContaining(':callback') as string,
    endTime: expect.any(Number) as number,
  });
});

it('unsub event', () => {
  const trace = vi.fn();
  const interceptor = new EventInterceptor();

  interceptor.addEventListener('unsub', (event) => {
    trace(event.type, event.eventId, event.targetAtom, event.data);
  });

  const store = createDebugStore(interceptor);
  const base$ = $value(1);
  store.sub(
    base$,
    $func(() => void 0, {
      debugLabel: 'callback',
    }),
  )();

  expect(trace).toBeCalledTimes(2);

  expect(trace).toHaveBeenNthCalledWith(1, 'unsub', expect.any(Number), expect.any(String), {
    state: 'begin',
    beginTime: expect.any(Number) as number,
    callback: expect.stringContaining(':callback') as string,
  });
  expect(trace).toHaveBeenNthCalledWith(2, 'unsub', expect.any(Number), expect.any(String), {
    state: 'end',
    beginTime: expect.any(Number) as number,
    callback: expect.stringContaining(':callback') as string,
    endTime: expect.any(Number) as number,
  });
});

it('mount event', () => {
  const trace = vi.fn();
  const interceptor = new EventInterceptor();

  interceptor.addEventListener('mount', (event) => {
    trace(event.type, event.eventId, event.targetAtom, event.data);
  });

  const base$ = $value(1, {
    debugLabel: 'base$',
  });
  const derived$ = $computed((get) => get(base$), {
    debugLabel: 'derived$',
  });

  const store = createDebugStore(interceptor);
  store.sub(
    derived$,
    $func(() => void 0),
  );

  expect(trace).toBeCalledTimes(2);

  expect(trace).toHaveBeenNthCalledWith(1, 'mount', expect.any(Number), expect.stringContaining(':derived$'), {
    time: expect.any(Number) as number,
  });
  expect(trace).toHaveBeenNthCalledWith(2, 'mount', expect.any(Number), expect.stringContaining(':base$'), {
    time: expect.any(Number) as number,
  });
});

it('unmount event', () => {
  const trace = vi.fn();
  const interceptor = new EventInterceptor();

  interceptor.addEventListener('unmount', (event) => {
    trace(event.type, event.eventId, event.targetAtom, event.data);
  });

  const base$ = $value(1, {
    debugLabel: 'base$',
  });
  const derived$ = $computed((get) => get(base$), {
    debugLabel: 'derived$',
  });

  const store = createDebugStore(interceptor);
  store.sub(
    derived$,
    $func(() => void 0),
  )();

  expect(trace).toBeCalledTimes(2);

  expect(trace).toHaveBeenNthCalledWith(1, 'unmount', expect.any(Number), expect.stringContaining(':derived$'), {
    time: expect.any(Number) as number,
  });
  expect(trace).toHaveBeenNthCalledWith(2, 'unmount', expect.any(Number), expect.stringContaining(':base$'), {
    time: expect.any(Number) as number,
  });
});

it('use remove event listener can stop listening', () => {
  const interceptor = new EventInterceptor();

  const callback = vi.fn();
  interceptor.addEventListener('get', callback);

  const store = createDebugStore(interceptor);
  const base$ = $value(1);
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
  const base$ = $value(1);
  store.get(base$);

  expect(callback).toBeCalledTimes(2);

  controller.abort();
  store.get(base$);

  expect(callback).toBeCalledTimes(2);
});
