import { computed, command, state, StoreEvent, type PackedEventMessage, type State } from 'ccstate';

const eventsMap$ = state<Map<number, State<PackedEventMessage> | undefined> | undefined>(undefined);
const event$ = state<State<PackedEventMessage>[] | undefined>(undefined);
const internalSelectedFilter$ = state<Set<StoreEvent['type']>>(new Set(['set', 'sub', 'notify']));
const internalFilterLabel$ = state<string>('');

export const selectedFilter$ = computed((get) => {
  return get(internalSelectedFilter$);
});

export const toggleFilter$ = command(({ get, set }, filter: StoreEvent['type']) => {
  const filters = new Set(get(internalSelectedFilter$));

  if (filters.has(filter)) {
    filters.delete(filter);
  } else {
    filters.add(filter);
  }

  set(internalSelectedFilter$, filters);
});

export const filterLabel$ = computed((get) => {
  return get(internalFilterLabel$);
});

export const updateFilterLabel$ = command(({ set }, label: string) => {
  set(internalFilterLabel$, label);
});

export const storeEvents$ = computed<State<PackedEventMessage>[]>((get) => {
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

export const onEvent$ = command(({ get, set }, event: PackedEventMessage) => {
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

  const atom = state(event);
  eventsMap.set(event.eventId, atom);

  const events = get(event$);
  if (!events) {
    set(event$, [atom]);
    return;
  }

  set(event$, [...events, atom]);
});

export const clearEvents$ = command(({ set }) => {
  set(event$, []);
  set(eventsMap$, undefined);
});
