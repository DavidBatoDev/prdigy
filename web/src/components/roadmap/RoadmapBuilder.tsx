import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import { getOrCreateGuestUser } from "@/lib/guestAuth";
import { roadmapService } from "@/services/roadmap.service";
import { useIsLoading, useUser } from "@/stores/authStore";

type RoadmapBuilderProps = {
  projectId?: string;
  embedded?: boolean;
};

export function RoadmapBuilder({
  projectId,
  embedded = false,
}: RoadmapBuilderProps) {
  const navigate = useNavigate();
  const authenticatedUser = useUser();
  const isAuthLoading = useIsLoading();
  const creationStartedRef = useRef(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading || creationStartedRef.current) return;

    creationStartedRef.current = true;

    const createRoadmap = async () => {
      try {
        if (!authenticatedUser) {
          const guestId = await getOrCreateGuestUser();
          if (!guestId) {
            throw new Error("Failed to initialize guest session");
          }
        }

        const roadmap = await roadmapService.create({
          name: "Untitled Roadmap",
          description: "",
          project_id: projectId || undefined,
          status: "draft",
          settings: {},
        });

        navigate({
          to: "/project/$projectId/roadmap/$roadmapId",
          params: { projectId: projectId || "n", roadmapId: roadmap.id },
        });
      } catch (createError) {
        console.error("Failed to auto-create roadmap:", createError);
        setError("Failed to create roadmap. Please try again.");
      }
    };

    void createRoadmap();
  }, [authenticatedUser, isAuthLoading, navigate, projectId]);

  return (
    <div
      className={`${embedded ? "h-full" : "min-h-screen pt-16"} bg-[#f6f7f8]`}
    >
      {!embedded && <Header />}

      <div className="h-full min-h-[50vh] flex items-center justify-center px-6">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#ff9933] mx-auto mb-3" />
          <p className="text-sm text-gray-600">Creating a new roadmap...</p>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </div>
      </div>
    </div>
  );
}
