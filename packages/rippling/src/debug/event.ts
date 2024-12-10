import type {
  GetEventData,
  MountEventData,
  SetEventData,
  SubEventData,
  UnmountEventData,
  UnsubEventData,
} from '../../types/debug/event';

export interface EventMap {
  get: GetEvent;
  set: SetEvent;
  sub: SubEvent;
  unsub: UnsubEvent;
  mount: MountEvent;
  unmount: UnmountEvent;
}

export class StoreEvent extends Event {
  constructor(
    type: string,
    public readonly eventId: number,
    public readonly targetAtom: string,
  ) {
    super(type);
  }
}

export class GetEvent extends StoreEvent {
  constructor(
    eventId: number,
    targetAtom: string,
    public readonly data: GetEventData,
  ) {
    super('get', eventId, targetAtom);
  }
}

export class SetEvent extends StoreEvent {
  constructor(
    eventId: number,
    targetAtom: string,
    public readonly data: SetEventData,
  ) {
    super('set', eventId, targetAtom);
  }
}

export class SubEvent extends StoreEvent {
  constructor(
    eventId: number,
    targetAtom: string,
    public readonly data: SubEventData,
  ) {
    super('sub', eventId, targetAtom);
  }
}

export class UnsubEvent extends StoreEvent {
  constructor(
    eventId: number,
    targetAtom: string,
    public readonly data: UnsubEventData,
  ) {
    super('unsub', eventId, targetAtom);
  }
}

export class MountEvent extends StoreEvent {
  constructor(
    eventId: number,
    targetAtom: string,
    public readonly data: MountEventData,
  ) {
    super('mount', eventId, targetAtom);
  }
}

export class UnmountEvent extends StoreEvent {
  constructor(
    eventId: number,
    targetAtom: string,
    public readonly data: UnmountEventData,
  ) {
    super('unmount', eventId, targetAtom);
  }
}
