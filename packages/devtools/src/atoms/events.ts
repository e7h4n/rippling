import { $computed, $func, $value, type EventMap, type PackedEventMessage, type Value } from 'rippling';

const eventsMap$ = $value<Map<number, Value<PackedEventMessage<keyof EventMap>> | undefined> | undefined>(undefined);
const event$ = $value<Value<PackedEventMessage<keyof EventMap>>[] | undefined>(undefined);

export const storeEvents$ = $computed<Value<PackedEventMessage<keyof EventMap>>[]>((get) => {
  const events = get(event$) ?? [];
  return events;
});

export const onEvent$ = $func(({ get, set }, event: PackedEventMessage<keyof EventMap>) => {
  let eventsMap = get(eventsMap$);
  if (!eventsMap) {
    eventsMap = new Map();
    set(eventsMap$, eventsMap);
  }

  const existedAtom$ = eventsMap.get(event.eventId);
  if (existedAtom$) {
    set(existedAtom$, event);
    return;
  }

  const atom = $value(event);
  eventsMap.set(event.eventId, atom);

  const events = get(event$);
  if (!events) {
    set(event$, [atom]);
    return;
  }

  set(event$, [...events, atom]);
});
