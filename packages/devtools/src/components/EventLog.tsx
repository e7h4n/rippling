import { useGet, type PackedEventMessage, type Value } from 'rippling';
import { storeEvents$ } from '../atoms/events';

export function EventLog() {
  const events = useGet(storeEvents$);

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
              <th className="text-left py-[3px] px-[6px] font-normal border-b border-[#e0e0e0]">Time</th>
              <th className="text-left py-[3px] px-[6px] font-normal border-b border-[#e0e0e0]">Op</th>
              <th className="text-left py-[3px] px-[6px] font-normal border-b border-[#e0e0e0]">Atom</th>
              <th className="text-left py-[3px] px-[6px] font-normal border-b border-[#e0e0e0]">Atom Type</th>
              <th className="text-left py-[3px] px-[6px] font-normal border-b border-[#e0e0e0]">Args</th>
              <th className="text-left py-[3px] px-[6px] font-normal border-b border-[#e0e0e0]">Return</th>
            </tr>
          </thead>
          <tbody className="text-[#333]">
            {events.map((event) => (
              <EventRow key={event.toString()} event$={event} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EventRow({ event$ }: { event$: Value<PackedEventMessage> }) {
  const event = useGet(event$);

  return (
    <tr data-testid="event-row">
      <td>{event.eventId}</td>
      <td>{event.type.toUpperCase()}</td>
      <td>{event.targetAtom}</td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
  );
}
