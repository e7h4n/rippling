import type {
  GetEventData,
  MountEventData,
  NotifyEventData,
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
  notify: NotifyEvent;
}

export class StoreEvent<T> extends Event {
  constructor(
    type: string,
    public readonly eventId: number,
    public readonly targetAtom: string,
    public readonly data: T,
  ) {
    super(type);
  }
}

export class GetEvent extends StoreEvent<GetEventData> {
  constructor(
    eventId: number,
    targetAtom: string,
    public override readonly data: GetEventData,
  ) {
    super('get', eventId, targetAtom, data);
  }
}

export class SetEvent extends StoreEvent<SetEventData> {
  constructor(
    eventId: number,
    targetAtom: string,
    public override readonly data: SetEventData,
  ) {
    super('set', eventId, targetAtom, data);
  }
}

export class SubEvent extends StoreEvent<SubEventData> {
  constructor(
    eventId: number,
    targetAtom: string,
    public override readonly data: SubEventData,
  ) {
    super('sub', eventId, targetAtom, data);
  }
}

export class UnsubEvent extends StoreEvent<UnsubEventData> {
  constructor(
    eventId: number,
    targetAtom: string,
    public override readonly data: UnsubEventData,
  ) {
    super('unsub', eventId, targetAtom, data);
  }
}

export class MountEvent extends StoreEvent<MountEventData> {
  constructor(
    eventId: number,
    targetAtom: string,
    public override readonly data: MountEventData,
  ) {
    super('mount', eventId, targetAtom, data);
  }
}

export class UnmountEvent extends StoreEvent<UnmountEventData> {
  constructor(
    eventId: number,
    targetAtom: string,
    public override readonly data: UnmountEventData,
  ) {
    super('unmount', eventId, targetAtom, data);
  }
}

export class NotifyEvent extends StoreEvent<NotifyEventData> {
  constructor(
    eventId: number,
    targetAtom: string,
    public override readonly data: NotifyEventData,
  ) {
    super('notify', eventId, targetAtom, data);
  }
}
