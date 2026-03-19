import type { ProjectMember } from "@/services/project.service";

export function memberDisplayName(member: ProjectMember): string {
  if (member.user?.display_name) return member.user.display_name;
  if (member.user?.first_name && member.user?.last_name)
    return `${member.user.first_name} ${member.user.last_name}`;
  if (member.user?.email) return member.user.email;
  return "Unknown Member";
}
