import { Calendar, User } from "lucide-react";
import type { ProjectMember } from "@/services/project.service";
import type { OverviewTimelineItem } from "./types";
import { milestoneState, nameFromMember, MAX_OVERVIEW_MILESTONES } from "./utils";

interface OverviewSidebarProps {
  timelineItems: OverviewTimelineItem[];
  members: ProjectMember[];
}

export function OverviewSidebar({ timelineItems, members }: OverviewSidebarProps) {
  const visibleItems = timelineItems.slice(0, MAX_OVERVIEW_MILESTONES);

  return (
    <aside className="space-y-8 sticky top-6 self-start md:pl-4">
      {/* Milestones */}
      <div>
        <h2 className="text-[16px] font-semibold text-gray-900 mb-4">
          Milestones
        </h2>
        {timelineItems.length === 0 ? (
          <div className="relative pl-11 pb-2">
            <span className="absolute left-[15px] top-7 bottom-0 w-px border-l-2 border-dashed border-gray-200" />
            <span className="absolute left-0 top-0 w-8 h-8 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50/50" />
            <div className="flex flex-col pt-1.5">
              <p className="text-[13px] font-medium text-gray-500">
                No milestones yet
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Project timeline will appear here
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {visibleItems.map((item, index) => {
              const style = milestoneState(item.status);
              const DotIcon = style.icon;
              return (
                <div key={item.id} className="relative pl-9 pb-5 last:pb-0">
                  {index < visibleItems.length - 1 && (
                    <span className="absolute left-[15px] top-7 bottom-0 w-px bg-gray-200" />
                  )}
                  <span
                    className={`absolute left-0 top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${style.dot}`}
                  >
                    <DotIcon className="w-4 h-4" />
                  </span>
                  <p
                    className={`text-[14px] font-semibold leading-5 ${style.title}`}
                  >
                    {item.title}
                  </p>
                  <p className="text-[12px] text-gray-500 mt-1 inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(item.target_date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                    <span className="uppercase tracking-wide text-[10px] text-gray-400">
                      {item.kind}
                    </span>
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <hr className="border-gray-200" />

      {/* Project Team */}
      <div>
        <h2 className="text-[16px] font-semibold text-gray-900 mb-3">
          Project Team
        </h2>
        {members.length === 0 ? (
          <p className="text-[13px] text-gray-500">No members yet.</p>
        ) : (
          <div className="flex items-center gap-2">
            {members.slice(0, 6).map((member, index) => (
              <div
                key={member.id}
                className={index > 0 ? "-ml-2" : ""}
                title={`${nameFromMember(member)} (${member.role})`}
              >
                {member.user?.avatar_url ? (
                  <img
                    src={member.user.avatar_url}
                    alt={nameFromMember(member)}
                    className="w-9 h-9 rounded-full border-2 border-white object-cover"
                  />
                ) : (
                  <span className="w-9 h-9 rounded-full border-2 border-white bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </span>
                )}
              </div>
            ))}
            {members.length > 6 && (
              <span className="-ml-2 w-9 h-9 rounded-full border-2 border-white bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">
                +{members.length - 6}
              </span>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
