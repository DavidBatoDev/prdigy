import { createFileRoute, Link } from "@tanstack/react-router";
import { LogIn, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { RoadmapViewContent } from "@/components/roadmap";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { ProjectSidebar } from "@/components/project/ProjectSidebar";
import { useRoadmapStore } from "@/stores/roadmapStore";
import { useUser } from "@/stores/authStore";
import { getOrCreateGuestUser } from "@/lib/guestAuth";

export const Route = createFileRoute("/project/roadmap/$roadmapId")({
  component: RoadmapViewPage,
});

function RoadmapViewPage() {
  const { roadmapId } = Route.useParams();
  const roadmap = useRoadmapStore((state) => state.roadmap);
  const formData = roadmap?.settings as any;
  const authenticatedUser = useUser();
  const [isGuest, setIsGuest] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Initialize user (authenticated or guest)
  useEffect(() => {
    const initializeUser = async () => {
      setIsLoadingUser(true);

      if (authenticatedUser) {
        setIsGuest(false);
      } else {
        await getOrCreateGuestUser();
        setIsGuest(true);
      }

      setIsLoadingUser(false);
    };

    initializeUser();
  }, [authenticatedUser]);

  if (isLoadingUser) {
    return (
      <div className="flex-1 min-h-screen bg-[#f6f7f8] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading user...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#f6f7f8] overflow-hidden">
      {/* Guest User Banner */}
      {isGuest && (
        <div className="relative z-50 bg-linear-to-r from-primary/90 to-primary text-white px-4 py-2 text-sm flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="font-medium">🎯 Guest Mode</span>
            <span className="opacity-90">
              Your roadmap will be saved for 30 days. Sign in to save
              permanently.
            </span>
          </div>
          <Link
            to="/auth/signup"
            search={{ redirect: window.location.pathname }}
            className="flex items-center gap-2 px-4 py-1.5 bg-white text-primary rounded-md hover:bg-gray-50 transition-colors font-medium"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </Link>
        </div>
      )}

      <ProjectHeader
        title={formData?.title || roadmap?.name || "Untitled Roadmap"}
        projectId={roadmap?.project_id ?? undefined}
      />
      <div className="flex flex-1 overflow-hidden">
        <ProjectSidebar
          project={null}
          projectId={roadmap?.project_id || roadmap?.id || ""}
          hasProject={!!roadmap?.project_id}
        />
        <main className="flex-1 overflow-hidden">
          <RoadmapViewContent roadmapId={roadmapId} />
        </main>
      </div>
    </div>
  );
}
