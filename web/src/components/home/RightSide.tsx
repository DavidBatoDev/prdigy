import { CalendarWidget } from "./CalendarWidget";
import { InboxPanel } from "./InboxPanel";

export function RightSide() {
  return (
    <div className="space-y-4">
      {/* Schedule */}
      <CalendarWidget />

      {/* Inbox */}
      <InboxPanel />
    </div>
  );
}
