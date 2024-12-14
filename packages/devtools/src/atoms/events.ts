import { $computed, $func, $value, StoreEvent, type PackedEventMessage, type Value } from 'rippling';

const eventsMap$ = $value<Map<number, Value<PackedEventMessage> | undefined> | undefined>(undefined);
const event$ = $value<Value<PackedEventMessage>[] | undefined>(undefined);
const internalSelectedFilter$ = $value<Set<StoreEvent['type']>>(new Set(['set', 'sub', 'notify']));
const internalFilterLabel$ = $value<string>('');

export const selectedFilter$ = $computed((get) => {
  return get(internalSelectedFilter$);
});

export const toggleFilter$ = $func(({ get, set }, filter: StoreEvent['type']) => {
  const filters = new Set(get(internalSelectedFilter$));

  if (filters.has(filter)) {
    filters.delete(filter);
  } else {
    filters.add(filter);
  }

  set(internalSelectedFilter$, filters);
});

export const filterLabel$ = $computed((get) => {
  return get(internalFilterLabel$);
});

export const updateFilterLabel$ = $func(({ set }, label: string) => {
  set(internalFilterLabel$, label);
});

export const storeEvents$ = $computed<Value<PackedEventMessage>[]>((get) => {
  const events = get(event$) ?? [];
  const selectedTypes = get(internalSelectedFilter$);
  const filterLabel = get(internalFilterLabel$).trim();
  return events.filter((e$) => {
    const e = get(e$);

    if (!selectedTypes.has(e.type)) {
      return false;
    }

    if (filterLabel && !e.targetAtom.includes(filterLabel)) {
      return false;
    }

    return true;
  });
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
