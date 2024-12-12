import type { EventMap, StoreEvent } from './event';
import { EventInterceptor } from './event-interceptor';

export interface PackedEventMessage<T extends keyof EventMap> {
  type: T;
  data: EventMap[T]['data'];
  eventId: number;
  targetAtom: string;
}

export interface DevToolsHookMessage {
  source: 'rippling-store-inspector';
  payload: PackedEventMessage<keyof EventMap>;
}

export const GLOBAL_RIPPLING_INTERCEPED_KEY = '__RIPPLING_INTERCEPED__';

export function setupDevtoolsInterceptor(targetWindow: Window) {
  const interceptor = new EventInterceptor();

  function handleStoreEvent<T extends keyof EventMap>(event: StoreEvent<EventMap[T]['data']>) {
    const message: DevToolsHookMessage = {
      source: 'rippling-store-inspector',
      payload: {
        type: event.type as T,
        data: event.data,
        eventId: event.eventId,
        targetAtom: event.targetAtom,
      } satisfies PackedEventMessage<T>,
    };
    targetWindow.postMessage(message);
  }
  interceptor.addEventListener('get', handleStoreEvent);
  interceptor.addEventListener('set', handleStoreEvent);
  interceptor.addEventListener('sub', handleStoreEvent);
  interceptor.addEventListener('unsub', handleStoreEvent);
  interceptor.addEventListener('mount', handleStoreEvent);
  interceptor.addEventListener('unmount', handleStoreEvent);

  (
    targetWindow as {
      [GLOBAL_RIPPLING_INTERCEPED_KEY]?: boolean;
    }
  )[GLOBAL_RIPPLING_INTERCEPED_KEY] = true;
  console.warn('[RIPPLING] Interceptor injected, DO NOT USE THIS IN PRODUCTION');

  return interceptor;
}
