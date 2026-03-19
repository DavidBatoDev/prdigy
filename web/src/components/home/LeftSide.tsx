import { Hero } from "./Hero";
import { ProgressTracker } from "./ProgressTracker";
import { FreelancerTodaySection } from "./FreelancerTodaySection";
import { MyWorkSection } from "./MyWorkSection";
// import { EscrowWallet } from "./EscrowWallet";
// import { ActivityOverview } from "./ActivityOverview";
import { ProjectsGrid } from "./ProjectsGrid";
import { RoadmapsGrid } from "./RoadmapsGrid";

export function PrimaryFlow() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <Hero />

      {/* Unified progress tracker */}
      <ProgressTracker />

      {/* Today */}
      <FreelancerTodaySection />

      {/* Escrow & Activity Overview */}
      {/* <div className="flex gap-6">
        <EscrowWallet />
        <ActivityOverview />
      </div> */}
    </div>
  );
}

export function LeftSide() {
  return (
    <div className="space-y-8">
      {/* Roadmaps Grid */}
      <RoadmapsGrid />

      {/* Projects Grid */}
      <ProjectsGrid />

      {/* My Work */}
      <MyWorkSection />
    </div>
  );
}
