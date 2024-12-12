import { $computed, $func, $value, type PackedEventMessage, type Value } from 'rippling';

const eventsMap$ = $value<Map<number, Value<PackedEventMessage>> | undefined>(undefined);
const event$ = $value<Value<PackedEventMessage>[] | undefined>(undefined);

export const storeEvents$ = $computed<Value<PackedEventMessage>[]>((get) => {
  return get(event$) ?? [];
});

export const onEvent$ = $func(({ get, set }, event: PackedEventMessage) => {
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

  let events = get(event$);
  if (!events) {
    events = [atom];
    set(event$, events);
    return;
  }

  events.push(atom);
  set(event$, events);
});
