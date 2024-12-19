import type { CallbackFunc, StoreInterceptor } from '../../types/core/store';
import type { StoreEventType } from '../../types/debug/event';
import { type Computed, type Command, type Updater, type State } from '../core';
import { StoreEvent } from './event';

export class EventInterceptor implements StoreInterceptor {
  private traceId = 0;
  private events = new EventTarget();

  private createEvent(
    type: StoreEventType,
    eventId: number,
    atom: string,
    time: DOMHighResTimeStamp,
    state: 'begin' | 'success' | 'error',
    args: unknown[],
    result: unknown,
  ) {
    const event = new StoreEvent(type, eventId, atom, state, time, args, result);
    this.events.dispatchEvent(event);
    return event;
  }

  private wrapWithTrace<Result>(
    fn: () => Result,
    createBeginEvent: (eventId: number, beginTime: number) => void,
    createSuccessEvent: (eventId: number, beginTime: number, result: unknown) => void,
    createErrorEvent: (eventId: number, beginTime: number, error: unknown) => void,
  ): Result {
    const eventId = this.traceId++;

    createBeginEvent(eventId, performance.now());

    try {
      const result = fn();
      createSuccessEvent(eventId, performance.now(), result);
      return result;
    } catch (e) {
      createErrorEvent(eventId, performance.now(), e);
      throw e;
    }
  }

  public addEventListener(
    type: StoreEventType,
    listener: (event: StoreEvent) => void,
    options?: AddEventListenerOptions | boolean,
  ) {
    this.events.addEventListener(type, listener as EventListener, options);
  }

  public removeEventListener(
    type: StoreEventType,
    listener: (event: StoreEvent) => void,
    options?: EventListenerOptions | boolean,
  ) {
    this.events.removeEventListener(type, listener as EventListener, options);
  }

  get = <T>(atom$: State<T> | Computed<T>, fn: () => T) => {
    return this.wrapWithTrace(
      fn,
      (eventId, time) => {
        this.createEvent('get', eventId, atom$.toString(), time, 'begin', [], undefined);
      },
      (eventId, time, result) => {
        this.createEvent('get', eventId, atom$.toString(), time, 'success', [], result);
      },
      (eventId, time, error) => {
        this.createEvent('get', eventId, atom$.toString(), time, 'error', [], error);
      },
    );
  };

  computed = <T>(atom$: Computed<T>, fn: () => T) => {
    return this.wrapWithTrace(
      fn,
      (eventId, time) => {
        this.createEvent('computed', eventId, atom$.toString(), time, 'begin', [], undefined);
      },
      (eventId, time, result) => {
        this.createEvent('computed', eventId, atom$.toString(), time, 'success', [], result);
      },
      (eventId, time, error) => {
        this.createEvent('computed', eventId, atom$.toString(), time, 'error', [], error);
      },
    );
  };

  set = <T, Args extends unknown[]>(
    atom$: State<T> | Command<T, Args>,
    fn: () => T,
    ...args: Args | [T | Updater<T>]
  ) => {
    return this.wrapWithTrace(
      fn,
      (eventId, time) => {
        this.createEvent('set', eventId, atom$.toString(), time, 'begin', args, undefined);
      },
      (eventId, time, result) => {
        this.createEvent('set', eventId, atom$.toString(), time, 'success', args, result);
      },
      (eventId, time, error) => {
        this.createEvent('set', eventId, atom$.toString(), time, 'error', args, error);
      },
    );
  };

  sub = <T>(atom$: State<T> | Computed<T>, callback$: CallbackFunc<T>, fn: () => void) => {
    const eventId = this.traceId++;

    this.createEvent('sub', eventId, atom$.toString(), performance.now(), 'begin', [callback$.toString()], undefined);

    fn();

    this.createEvent('sub', eventId, atom$.toString(), performance.now(), 'success', [callback$.toString()], undefined);
  };

  unsub = <T>(atom$: State<T> | Computed<T>, callback$: CallbackFunc<T>, fn: () => void) => {
    const eventId = this.traceId++;

    this.createEvent('unsub', eventId, atom$.toString(), performance.now(), 'begin', [callback$.toString()], undefined);

    fn();

    this.createEvent(
      'unsub',
      eventId,
      atom$.toString(),
      performance.now(),
      'success',
      [callback$.toString()],
      undefined,
    );
  };

  mount = <T>(atom$: State<T> | Computed<T>) => {
    const eventId = this.traceId++;
    this.createEvent('mount', eventId, atom$.toString(), performance.now(), 'begin', [], undefined);
  };

  unmount = <T>(atom$: State<T> | Computed<T>) => {
    const eventId = this.traceId++;
    this.createEvent('unmount', eventId, atom$.toString(), performance.now(), 'begin', [], undefined);
  };

  notify = <T>(callback$: CallbackFunc<T>, fn: () => T) => {
    const eventId = this.traceId++;

    this.createEvent('notify', eventId, callback$.toString(), performance.now(), 'begin', [], undefined);

    const ret = fn();

    this.createEvent('notify', eventId, callback$.toString(), performance.now(), 'success', [], ret);
  };
}
