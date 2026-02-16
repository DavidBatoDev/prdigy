import { Hero } from "./Hero";
import { EscrowWallet } from "./EscrowWallet";
import { ActivityOverview } from "./ActivityOverview";
import { ProjectsGrid } from "./ProjectsGrid";
import { RoadmapsGrid } from "./RoadmapsGrid";

export function LeftSide() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <Hero />

      {/* Escrow & Activity Overview */}
      <div className="flex gap-6">
        <EscrowWallet />
        <ActivityOverview />
      </div>

      {/* Projects Grid */}
      <ProjectsGrid />

      {/* Roadmaps Grid */}
      <RoadmapsGrid />
    </div>
  );
}
