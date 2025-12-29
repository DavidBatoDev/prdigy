import { CalendarWidget } from "./CalendarWidget";
import { ActivityFeed } from "./ActivityFeed";

export function RightSide() {
  return (
    <div className="space-y-4">
      {/* Calendar */}
      <CalendarWidget />

      {/* Activity Feed */}
      <ActivityFeed />
    </div>
  );
}
