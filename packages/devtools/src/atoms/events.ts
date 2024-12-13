import { $computed, $func, $value, type EventMap, type PackedEventMessage, type Value } from 'rippling';

const eventsMap$ = $value<Map<number, Value<PackedEventMessage<keyof EventMap>> | undefined> | undefined>(undefined);
const event$ = $value<Value<PackedEventMessage<keyof EventMap>>[] | undefined>(undefined);
const internalSelectedFilter$ = $value<Set<keyof EventMap>>(new Set(['set', 'sub', 'notify']));
export const selectedFilter$ = $computed((get) => {
  return get(internalSelectedFilter$);
});

export const toggleFilter$ = $func(({ get, set }, filter: keyof EventMap) => {
  const filters = new Set(get(internalSelectedFilter$));

  if (filters.has(filter)) {
    filters.delete(filter);
  } else {
    filters.add(filter);
  }

  set(internalSelectedFilter$, filters);
});

export const storeEvents$ = $computed<Value<PackedEventMessage<keyof EventMap>>[]>((get) => {
  const events = get(event$) ?? [];
  return events.filter((e$) => {
    const e = get(e$);

    return get(internalSelectedFilter$).has(e.type);
  });
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

export const clearEvents$ = $func(({ set }) => {
  set(event$, []);
  set(eventsMap$, undefined);
});
