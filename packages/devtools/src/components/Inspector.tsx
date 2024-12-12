import { EventLog } from './EventLog';

export function Inspector() {
  return (
    <div className="min-h-screen h-screen bg-[#f3f3f3] text-[#333333] flex flex-col">
      <EventLog className="flex-1 bg-white" />
    </div>
  );
}
