import type { CallbackFunc, StoreInterceptor } from '../../types/core/store';
import type {
  GetEventData,
  MountEventData,
  SetEventData,
  SubEventData,
  UnmountEventData,
  UnsubEventData,
} from '../../types/debug/event';
import { type Computed, type Func, type Updater, type Value } from '../core';
import { GetEvent, SetEvent, SubEvent, UnsubEvent, type EventMap, MountEvent, UnmountEvent } from './event';

export class EventInterceptor implements StoreInterceptor {
  private traceId = 0;
  private events = new EventTarget();

  private createEvent<T extends keyof EventMap, EventData>(
    EventClass: new (eventId: number, targetAtom: string, data: EventData) => EventMap[T],
    eventId: number,
    atom: string,
    data: EventData,
  ) {
    const event = new EventClass(eventId, atom, data);
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
    const beginTime = performance.now();

    createBeginEvent(eventId, beginTime);

    try {
      const result = fn();
      createSuccessEvent(eventId, beginTime, result);
      return result;
    } catch (e) {
      createErrorEvent(eventId, beginTime, e);
      throw e;
    }
  }

  public addEventListener<K extends keyof EventMap>(
    type: K,
    listener: (event: EventMap[K]) => void,
    options?: AddEventListenerOptions | boolean,
  ) {
    this.events.addEventListener(type, listener as EventListener, options);
  }

  public removeEventListener<K extends keyof EventMap>(
    type: K,
    listener: (event: EventMap[K]) => void,
    options?: EventListenerOptions | boolean,
  ) {
    this.events.removeEventListener(type, listener as EventListener, options);
  }

  get = <T>(atom$: Value<T> | Computed<T>, fn: () => T) => {
    return this.wrapWithTrace(
      fn,
      (eventId, beginTime) => {
        this.createEvent(GetEvent, eventId, atom$.toString(), {
          state: 'begin',
          beginTime,
        } as GetEventData);
      },
      (eventId, beginTime, result) => {
        this.createEvent(GetEvent, eventId, atom$.toString(), {
          state: 'hasData',
          data: result,
          beginTime,
          endTime: performance.now(),
        } as GetEventData);
      },
      (eventId, beginTime, error) => {
        this.createEvent(GetEvent, eventId, atom$.toString(), {
          state: 'hasError',
          error,
          beginTime,
          endTime: performance.now(),
        } as GetEventData);
      },
    );
  };

  set = <T, Args extends unknown[]>(atom$: Value<T> | Func<T, Args>, fn: () => T, ...args: Args | [T | Updater<T>]) => {
    return this.wrapWithTrace(
      fn,
      (eventId, beginTime) => {
        this.createEvent(SetEvent, eventId, atom$.toString(), {
          state: 'begin',
          args,
          beginTime,
        } as SetEventData);
      },
      (eventId, beginTime, result) => {
        this.createEvent(SetEvent, eventId, atom$.toString(), {
          state: 'hasData',
          data: result,
          args,
          beginTime,
          endTime: performance.now(),
        } as SetEventData);
      },
      (eventId, beginTime, error) => {
        this.createEvent(SetEvent, eventId, atom$.toString(), {
          state: 'hasError',
          error,
          args,
          beginTime,
          endTime: performance.now(),
        } as SetEventData);
      },
    );
  };

  sub = <T>(atom$: Value<T> | Computed<T>, callback$: CallbackFunc<T>, fn: () => void) => {
    const eventId = this.traceId++;
    const beginTime = performance.now();

    this.createEvent(SubEvent, eventId, atom$.toString(), {
      state: 'begin',
      callback: callback$.toString(),
      beginTime,
    } as SubEventData);

    fn();

    this.createEvent(SubEvent, eventId, atom$.toString(), {
      state: 'end',
      callback: callback$.toString(),
      beginTime,
      endTime: performance.now(),
    } as SubEventData);
  };

  unsub = <T>(atom$: Value<T> | Computed<T>, callback$: CallbackFunc<T>, fn: () => void) => {
    const eventId = this.traceId++;
    const beginTime = performance.now();

    this.createEvent(UnsubEvent, eventId, atom$.toString(), {
      state: 'begin',
      callback: callback$.toString(),
      beginTime,
    } as UnsubEventData);

    fn();

    this.createEvent(UnsubEvent, eventId, atom$.toString(), {
      state: 'end',
      callback: callback$.toString(),
      beginTime,
      endTime: performance.now(),
    } as UnsubEventData);
  };
  mount = <T>(atom$: Value<T> | Computed<T>) => {
    const eventId = this.traceId++;
    const time = performance.now();
    this.createEvent(MountEvent, eventId, atom$.toString(), {
      time,
    } as MountEventData);
  };
  unmount = <T>(atom$: Value<T> | Computed<T>) => {
    const eventId = this.traceId++;
    const time = performance.now();
    this.createEvent(UnmountEvent, eventId, atom$.toString(), {
      time,
    } as UnmountEventData);
  };
  //   notify = <T>(callback$: CallbackFunc<T>, fn: () => T) => {
  //     fn();
  //   };
}
