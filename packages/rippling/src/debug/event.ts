import type { StoreEventType } from '../../types/debug/event';

export class StoreEvent extends Event {
  constructor(
    type: StoreEventType,
    public readonly eventId: number,
    public readonly targetAtom: string,
    public readonly state: 'begin' | 'success' | 'error',
    public readonly time: DOMHighResTimeStamp,
    public readonly args: unknown[],
    public readonly result: unknown,
  ) {
    super(type);
  }
}
