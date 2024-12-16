import type { StoreEvent } from './event';
import { EventInterceptor } from './event-interceptor';

export type PackedEventMessage = Pick<StoreEvent, 'type' | 'eventId' | 'targetAtom' | 'time' | 'state'>;

export interface DevToolsHookMessage {
  source: 'rippling-store';
  payload: PackedEventMessage;
}

interface DevtoolsCommandMessage {
  type: 'command';
  command: 'watch';
  args: [string];
}

export const GLOBAL_RIPPLING_INTERCEPED_KEY = '__RIPPLING_INTERCEPED__';

export function setupDevtoolsInterceptor(targetWindow: Window, signal?: AbortSignal) {
  const interceptor = new EventInterceptor();

  const watchedAtoms = new Set<string>();

  targetWindow.addEventListener(
    'message',
    ({ data }) => {
      if (
        !data ||
        typeof data !== 'object' ||
        !('source' in data) ||
        (data as { source: string }).source !== 'rippling-devtools'
      ) {
        return;
      }

      const payload = (data as { payload: DevtoolsCommandMessage }).payload;
      watchedAtoms.add(payload.args[0]);
    },
    {
      signal,
    },
  );

  function handleStoreEvent(event: StoreEvent) {
    const debugLabel = event.targetAtom.substring(event.targetAtom.indexOf(':') + 1);

    if (watchedAtoms.has(debugLabel)) {
      console.group(`[Rippling] ${event.type} ${event.targetAtom} ${event.state}`);
      console.log('args', event.args);
      console.log('result', event.result);
      console.groupEnd();
    }

    const message: DevToolsHookMessage = {
      source: 'rippling-store',
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
