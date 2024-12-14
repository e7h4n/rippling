import type { StoreEvent } from './event';
import { EventInterceptor } from './event-interceptor';

export type PackedEventMessage = Pick<StoreEvent, 'type' | 'eventId' | 'targetAtom' | 'time' | 'state'>;

export interface DevToolsHookMessage {
  source: 'rippling-store-inspector';
  payload: PackedEventMessage;
}

export const GLOBAL_RIPPLING_INTERCEPED_KEY = '__RIPPLING_INTERCEPED__';

export function setupDevtoolsInterceptor(targetWindow: Window) {
  const interceptor = new EventInterceptor();

  function handleStoreEvent(event: StoreEvent) {
    const message: DevToolsHookMessage = {
      source: 'rippling-store-inspector',
      payload: {
        type: event.type,
        eventId: event.eventId,
        targetAtom: event.targetAtom,
        time: event.time,
        state: event.state,
      } satisfies PackedEventMessage,
    };
    targetWindow.postMessage(message);
  }
  interceptor.addEventListener('get', handleStoreEvent);
  interceptor.addEventListener('set', handleStoreEvent);
  interceptor.addEventListener('sub', handleStoreEvent);
  interceptor.addEventListener('unsub', handleStoreEvent);
  interceptor.addEventListener('mount', handleStoreEvent);
  interceptor.addEventListener('unmount', handleStoreEvent);
  interceptor.addEventListener('notify', handleStoreEvent);
  (
    targetWindow as {
      [GLOBAL_RIPPLING_INTERCEPED_KEY]?: boolean;
    }
  )[GLOBAL_RIPPLING_INTERCEPED_KEY] = true;
  console.warn('[RIPPLING] Interceptor injected, DO NOT USE THIS IN PRODUCTION');

  return interceptor;
}
