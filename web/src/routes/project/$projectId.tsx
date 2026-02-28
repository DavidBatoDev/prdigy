import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { projectService, type Project } from "@/services/project.service";
import { ProjectSidebar } from "@/components/project/ProjectSidebar";
import { useProjectSettingsStore } from "@/stores/projectSettingsStore";
import { roadmapService } from "@/services/roadmap.service";
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
  const [linkedRoadmapId, setLinkedRoadmapId] = useState<string | null>(null);
  const setSidebarExpanded = useProjectSettingsStore(
    (state) => state.setSidebarExpanded,
  );

  // Auto-open project sidebar when navigating to project pages (non-roadmap)
  useEffect(() => {
    setSidebarExpanded(true);
  }, [setSidebarExpanded]);

  useEffect(() => {
    if (projectId === "n") {
      setIsLoading(false);
      return;
    }
    const loadProject = async () => {
      try {
        setIsLoading(true);
        const data = await projectService.get(projectId);
        setProject(data);
        // Look up the roadmap linked to this project
        const roadmap = await roadmapService.getByProjectId(projectId);
        if (roadmap) setLinkedRoadmapId(roadmap.id);
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

  const isRoadmapOnly = projectId === "n";

  return (
    <div className="flex flex-col h-screen bg-[#f6f7f8] overflow-hidden pt-14">
      <div className="flex flex-1 overflow-hidden">
        <ProjectSidebar project={project} projectId={projectId} hasProject={!isRoadmapOnly && !!project} roadmapId={linkedRoadmapId ?? undefined} />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
