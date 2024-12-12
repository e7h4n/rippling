import { useGet, useSet, type EventMap, type PackedEventMessage, type Value } from 'rippling';
import { clearEvents$, storeEvents$ } from '../atoms/events';
import type { HTMLAttributes, ReactNode } from 'react';

function isMountEvent(
  event: PackedEventMessage<keyof EventMap>,
): event is PackedEventMessage<'mount'> | PackedEventMessage<'unmount'> {
  return event.type === 'mount' || event.type === 'unmount';
}

function isSubEvent(
  event: PackedEventMessage<keyof EventMap>,
): event is PackedEventMessage<'sub'> | PackedEventMessage<'unsub'> {
  return event.type === 'sub' || event.type === 'unsub';
}

function isGetEvent(
  event: PackedEventMessage<keyof EventMap>,
): event is PackedEventMessage<'get'> | PackedEventMessage<'set'> {
  return event.type === 'get' || event.type === 'set';
}

function isSetEvent(event: PackedEventMessage<keyof EventMap>): event is PackedEventMessage<'set'> {
  return event.type === 'set';
}

function isNotifyEvent(event: PackedEventMessage<keyof EventMap>): event is PackedEventMessage<'notify'> {
  return event.type === 'notify';
}

export function EventLog(props: HTMLAttributes<HTMLDivElement>) {
  const event$s = useGet(storeEvents$);
  const clearEvents = useSet(clearEvents$);

  return (
    <div className="h-full flex flex-col bg-white" {...props}>
      <div className="p-2 border-b border-[#e0e0e0] flex justify-between items-center bg-[#f3f3f3]">
        <div>
          <button
            className="w-[20px] h-[20px] flex items-center justify-center rounded hover:bg-[#e0e0e0] text-[#666]"
            onClick={clearEvents}
            data-testid="clear-events"
          >
            <svg viewBox="0 0 24 24" className="w-[14px] h-[14px]" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
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
              <th className="text-left py-[3px] px-[6px] font-normal border-b border-[#e0e0e0]">Cost Time</th>
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

function EventRow({ event$ }: { event$: Value<PackedEventMessage<keyof EventMap>> }) {
  const event = useGet(event$);

  const rowData: (string | number | ReactNode | null)[] = [];

  // 通用字段
  rowData.push(event.eventId);
  rowData.push(event.type.toUpperCase());
  rowData.push(event.targetAtom);

  if (isMountEvent(event)) {
    rowData.push('');
    rowData.push('');
    rowData.push('');
  } else if (isSubEvent(event)) {
    rowData.push(event.data.state === 'end' ? <CostTime time={event.data.endTime - event.data.beginTime} /> : '...');
    rowData.push(event.data.callback);
    rowData.push('');
  } else if (isGetEvent(event)) {
    rowData.push(event.data.state === 'begin' ? '...' : <CostTime time={event.data.endTime - event.data.beginTime} />);
    rowData.push('');
    if (event.data.state === 'hasData') {
      rowData.push(<ReturnValue value={event.data.data} />);
    } else if (event.data.state === 'hasError') {
      rowData.push(String(event.data.error));
    } else {
      rowData.push('...');
    }
  } else if (isSetEvent(event)) {
    rowData.push(event.data.state === 'begin' ? '...' : <CostTime time={event.data.endTime - event.data.beginTime} />);
    rowData.push(event.data.args.map(String).join(', '));
    if (event.data.state === 'hasData') {
      rowData.push(<ReturnValue value={event.data.data} />);
    } else if (event.data.state === 'hasError') {
      rowData.push(String(event.data.error));
    } else {
      rowData.push('...');
    }
  } else if (isNotifyEvent(event)) {
    rowData.push(event.data.state === 'begin' ? '...' : <CostTime time={event.data.endTime - event.data.beginTime} />);
    rowData.push('');
    rowData.push(event.data.state === 'end' ? <ReturnValue value={event.data.data} /> : '');
  }

  return (
    <tr data-testid="event-row">
      {rowData.map((cell, i) => (
        <td key={i} className="py-[3px] px-[6px] border-b border-[#e0e0e0]">
          {cell}
        </td>
      ))}
    </tr>
  );
}

function CostTime({ time }: { time: number }) {
  return <>{(time * 1000).toFixed(0)}us</>;
}

function ReturnValue({ value }: { value: unknown }) {
  return <>{String(value === undefined ? '' : value)}</>;
}
