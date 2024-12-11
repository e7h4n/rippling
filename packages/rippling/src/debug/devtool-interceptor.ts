import type { EventMap, StoreEvent } from './event';
import { EventInterceptor } from './event-interceptor';

export interface PackedEventMessage {
  type: keyof EventMap;
  data: EventMap[keyof EventMap]['data'];
  eventId: number;
  targetAtom: string;
}

export function setupDevtoolsInterceptor(): EventInterceptor {
  (
    window as {
      __RIPPLING_DEVTOOLS_GLOBAL_HOOK__?: boolean;
    }
  ).__RIPPLING_DEVTOOLS_GLOBAL_HOOK__ = true;

  const interceptor = new EventInterceptor();

  function handleStoreEvent(event: StoreEvent<unknown>) {
    window.postMessage({
      source: 'rippling-store-inspector',
      payload: {
        type: event.type as keyof EventMap,
        data: event.data as EventMap[keyof EventMap]['data'],
        eventId: event.eventId,
        targetAtom: event.targetAtom,
      } satisfies PackedEventMessage,
    });
  }
  interceptor.addEventListener('get', handleStoreEvent);
  interceptor.addEventListener('set', handleStoreEvent);
  interceptor.addEventListener('sub', handleStoreEvent);
  interceptor.addEventListener('unsub', handleStoreEvent);
  interceptor.addEventListener('mount', handleStoreEvent);
  interceptor.addEventListener('unmount', handleStoreEvent);

  return interceptor;
}
