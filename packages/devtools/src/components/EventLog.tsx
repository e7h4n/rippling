import {
  useGet,
  type EventMap,
  type GetEventData,
  type MountEventData,
  type PackedEventMessage,
  type SetEventData,
  type SubEventData,
  type UnmountEventData,
  type UnsubEventData,
  type Value,
} from 'rippling';
import { storeEvents$ } from '../atoms/events';

export function EventLog() {
  const event$s = useGet(storeEvents$);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-2 border-b border-[#e0e0e0] flex justify-between items-center bg-[#f3f3f3]">
        <div></div>
        <div className="relative">
          <input
            type="text"
            placeholder="debug label"
            className="h-[20px] pl-[20px] pr-2 rounded text-[11px] bg-white border border-[#ccc] focus:outline-none focus:border-[#2196f3] focus:ring-1 focus:ring-[#2196f3] placeholder:text-[#999]"
          />
          <svg
            className="absolute left-[4px] top-1/2 -translate-y-1/2 w-[12px] h-[12px] text-[#666]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full border-collapse text-[11px] leading-[14px]">
          <thead>
            <tr className="bg-[#f3f3f3] text-[#5f6368]">
              <th className="text-left py-[3px] px-[6px] font-normal border-b border-[#e0e0e0]">ID</th>
              <th className="text-left py-[3px] px-[6px] font-normal border-b border-[#e0e0e0]">Op</th>
              <th className="text-left py-[3px] px-[6px] font-normal border-b border-[#e0e0e0]">Atom</th>
              <th className="text-left py-[3px] px-[6px] font-normal border-b border-[#e0e0e0]">Atom Type</th>
              <th className="text-left py-[3px] px-[6px] font-normal border-b border-[#e0e0e0]">Args</th>
              <th className="text-left py-[3px] px-[6px] font-normal border-b border-[#e0e0e0]">Return</th>
            </tr>
          </thead>
          <tbody className="text-[#333]">
            {event$s.map((event$) => (
              <EventRow key={event$.toString()} event$={event$} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EventRow<T extends keyof EventMap>({ event$ }: { event$: Value<PackedEventMessage<T>> }) {
  const event: PackedEventMessage<T> = useGet(event$);

  if (event.type === 'mount') {
    return <MountEventRow event={event as PackedEventMessage<'mount'>} />;
  }

  if (event.type === 'unmount') {
    return <UnmountEventRow event={event as PackedEventMessage<'unmount'>} />;
  }

  if (event.type === 'get') {
    return <GetEventRow event={event as PackedEventMessage<'get'>} />;
  }

  if (event.type === 'set') {
    return <SetEventRow event={event as PackedEventMessage<'set'>} />;
  }

  if (event.type === 'sub') {
    return <SubEventRow event={event as PackedEventMessage<'sub'>} />;
  }

  if (event.type === 'unsub') {
    return <UnsubEventRow event={event as PackedEventMessage<'unsub'>} />;
  }

  return null;
}

function MountEventRow({ event }: { event: PackedEventMessage<'mount'> }) {
  const data: MountEventData = event.data;

  return (
    <tr data-testid="event-row">
      <td>{event.eventId}</td>
      <td>{event.type.toUpperCase()}</td>
      <td>{event.targetAtom}</td>
      <td>{data.time}</td>
      <td></td>
      <td></td>
    </tr>
  );
}

function UnmountEventRow({ event }: { event: PackedEventMessage<'unmount'> }) {
  const data: UnmountEventData = event.data;

  return (
    <tr data-testid="event-row">
      <td>{event.eventId}</td>
      <td>{event.type.toUpperCase()}</td>
      <td>{event.targetAtom}</td>
      <td>{data.time}</td>
      <td></td>
      <td></td>
    </tr>
  );
}

function SubEventRow({ event }: { event: PackedEventMessage<'sub'> }) {
  const data: SubEventData = event.data;

  return (
    <tr data-testid="event-row">
      <td>{event.eventId}</td>
      <td>{event.type.toUpperCase()}</td>
      <td>{event.targetAtom}</td>
      <td>{data.beginTime}</td>
      <td>{data.state === 'end' ? data.endTime : ''}</td>
      <td>{data.callback}</td>
    </tr>
  );
}

function UnsubEventRow({ event }: { event: PackedEventMessage<'unsub'> }) {
  const data: UnsubEventData = event.data;

  return (
    <tr data-testid="event-row">
      <td>{event.eventId}</td>
      <td>{event.type.toUpperCase()}</td>
      <td>{event.targetAtom}</td>
      <td>{data.beginTime}</td>
      <td>{data.state === 'end' ? data.endTime : ''}</td>
      <td>{data.callback}</td>
    </tr>
  );
}

function GetEventRow({ event }: { event: PackedEventMessage<'get'> }) {
  const data: GetEventData = event.data;

  return (
    <tr data-testid="event-row">
      <td>{event.eventId}</td>
      <td>{event.type.toUpperCase()}</td>
      <td>{event.targetAtom}</td>
      <td>{data.beginTime}</td>
      <td>{data.state !== 'begin' ? data.endTime : ''}</td>
      <td>{data.state === 'hasData' ? String(data.data) : data.state === 'hasError' ? String(data.error) : ''}</td>
    </tr>
  );
}

function SetEventRow({ event }: { event: PackedEventMessage<'set'> }) {
  const data: SetEventData = event.data;

  return (
    <tr data-testid="event-row">
      <td>{event.eventId}</td>
      <td>{event.type.toUpperCase()}</td>
      <td>{event.targetAtom}</td>
      <td>{data.beginTime}</td>
      <td>{data.state !== 'begin' ? data.endTime : ''}</td>
      <td>{data.state === 'hasData' ? String(data.data) : data.state === 'hasError' ? String(data.error) : ''}</td>
    </tr>
  );
}
