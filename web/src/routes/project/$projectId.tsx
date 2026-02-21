import {
  createFileRoute,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { projectService, type Project } from "@/services/project.service";
import { ProjectSidebar } from "@/components/project/ProjectSidebar";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/project/$projectId")({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: "/auth/login" });
    }
  },
  component: ProjectLayout,
});

function ProjectLayout() {
  const { projectId } = Route.useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setIsLoading(true);
        const data = await projectService.get(projectId);
        setProject(data);
      } catch (err) {
        console.error("Failed to load project:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProject();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#ff9933]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#f6f7f8] overflow-hidden">
      <ProjectHeader
        title={project?.title ?? "Project"}
        projectId={project?.id}
        clientId={project?.client_id}
        consultantId={project?.consultant_id}
        viewingAs={project?.consultant_id ? "CONSULTANT" : "CLIENT"}
      />
      <div className="flex flex-1 overflow-hidden">
        <ProjectSidebar project={project} projectId={projectId} hasProject={true} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
