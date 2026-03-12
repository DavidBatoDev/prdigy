import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProjectSettingsLayout } from "@/components/project/ProjectSettingsLayout";
import { useToast } from "@/hooks/useToast";
import { projectService, type ProjectMember } from "@/services/project.service";

export const Route = createFileRoute("/project/$projectId/settings/team")({
  component: TeamSettingsPage,
});

function TeamSettingsPage() {
  const { projectId } = Route.useParams();
  const toast = useToast();
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await projectService.getMembers(projectId);
        setMembers(data);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load team members.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [projectId]);

  return (
    <ProjectSettingsLayout projectId={projectId}>
      <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <header className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-gray-900">Team Settings</h2>
            <p className="text-xs text-gray-500 mt-1">
              Members and positions for this project.
            </p>
          </div>
          <Link
            to="/project/$projectId/team"
            params={{ projectId }}
            className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Open full team management
          </Link>
        </header>

        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="px-5 py-6 text-sm text-gray-500">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="px-5 py-6 text-sm text-gray-500">No members found.</div>
          ) : (
            members.map((member) => {
              const displayName =
                member.user?.display_name ||
                [member.user?.first_name, member.user?.last_name]
                  .filter(Boolean)
                  .join(" ") ||
                member.user?.email ||
                "Unknown";

              return (
                <div key={member.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {member.user?.email || "No email"}
                    </p>
                  </div>
                  <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                    {member.position?.trim() || "Member"}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>
    </ProjectSettingsLayout>
  );
}
