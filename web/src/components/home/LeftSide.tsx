import { Hero } from "./Hero";
import { MyWorkSection } from "./MyWorkSection";
import { ProjectsGrid } from "./ProjectsGrid";
import { RoadmapsGrid } from "./RoadmapsGrid";
import { ConsultantDashboardWidgets } from "./ConsultantDashboardWidgets";
import { useAuthStore } from "@/stores/authStore";

export function PrimaryFlow() {
  const { profile } = useAuthStore();
  const persona = profile?.active_persona || "client";
  const isFreelancer = persona === "freelancer";

  return (
    <ConsultantDashboardWidgets leadContent={<Hero />}>
      {!isFreelancer ? (
        <>
          {/* Projects Grid */}
          <ProjectsGrid />
        </>
      ) : null}

      {/* Roadmaps Grid */}
      <RoadmapsGrid />

      {!isFreelancer ? (
        <>
          {/* My Work */}
          <MyWorkSection />
        </>
      ) : null}
    </ConsultantDashboardWidgets>
  );
}

export function LeftSide() {
  return (
    <div className="space-y-8">
      {/* Projects Grid */}
      <ProjectsGrid />

      {/* Roadmaps Grid */}
      <RoadmapsGrid />

      {/* My Work */}
      <MyWorkSection />
    </div>
  );
}
