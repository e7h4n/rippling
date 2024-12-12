import type { EventMap } from 'rippling';

export interface DevToolsHookMessage {
  source: string;
  payload: unknown;
}

export interface PackedEventMessage {
  type: keyof EventMap;
  data: EventMap[keyof EventMap]['data'];
  eventId: number;
  targetAtom: string;
}
