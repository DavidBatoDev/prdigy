import { useState } from "react";
import { Users } from "lucide-react";
import type { ProjectMember } from "@/services/project.service";
import { projectService } from "@/services/project.service";
import { PersonCard } from "./PersonCard";
import { EditableRole } from "./EditableRole";
import { memberDisplayName } from "./utils";

interface MembersTableProps {
  members: ProjectMember[];
  projectId: string;
  canManage: boolean;
  onOpenManage: (member: ProjectMember) => void;
  onRemove: (id: string) => void;
}

export function MembersTable({
  members,
  projectId,
  canManage,
  onOpenManage,
  onRemove,
}: MembersTableProps) {
  const [removing, setRemoving] = useState<string | null>(null);

  const handleRemove = async (member: ProjectMember) => {
    if (!window.confirm(`Remove "${memberDisplayName(member)}" from the team?`))
      return;
    setRemoving(member.id);
    try {
      await projectService.removeMember(projectId, member.id);
      onRemove(member.id);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-gray-300" />
          <p className="text-[12px] font-bold text-gray-700 tracking-wide">
            Project Members
          </p>
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500">
            {members.length}
          </span>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3">
            <Users className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-[12px] text-gray-400">
            {canManage
              ? "No members yet — add your first team member above."
              : "No members assigned to this project yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {members.map((m) => (
            <PersonCard
              key={m.id}
              name={memberDisplayName(m)}
              email={m.user?.email}
              avatarUrl={m.user?.avatar_url}
              onRemove={canManage ? () => void handleRemove(m) : undefined}
              removing={removing === m.id}
            >
              <EditableRole
                label={m.position?.trim() || "Member"}
                canEdit={canManage}
                onOpenManage={() => onOpenManage(m)}
              />
            </PersonCard>
          ))}
        </div>
      )}
    </div>
  );
}
