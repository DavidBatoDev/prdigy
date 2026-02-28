import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Map,
  ListChecks,
  Clock,
  CreditCard,
  FolderOpen,
} from "lucide-react";
import { useState } from "react";
import type { Project } from "@/services/project.service";

interface ProjectSidebarProps {
  project: Project | null;
  projectId: string;
  hasProject?: boolean;
  /** The id of the roadmap linked to this project, if any */
  roadmapId?: string;
}

export function ProjectSidebar({ project, projectId, hasProject, roadmapId }: ProjectSidebarProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  
  const [isExpanded, setIsExpanded] = useState(false);

  // If we're on a project route (like /project/.../overview), we should show tabs.
  // We can assume it's a project if `hasProject` is strictly true or false,
  // OR if we're not inside the roadmap view and we have a project object or are loading one.
  const isRoadmapView = currentPath.includes("/roadmap");
  const isProjectActive = hasProject ?? (!isRoadmapView || project !== null);

  const navItems = [
    {
      label: "Overview",
      icon: LayoutDashboard,
      to: `/project/${projectId}/overview`,
      requiresProject: true,
    },
    {
      label: "Roadmap",
      icon: Map,
      to: roadmapId
        ? `/project/${projectId}/roadmap/${roadmapId}`
        : `/project/${projectId}/roadmap`,
      requiresProject: false,
    },
    {
      label: "Work Items",
      icon: ListChecks,
      to: `/project/${projectId}/work-items`,
      requiresProject: false,
    },
    {
      label: "Time",
      icon: Clock,
      to: `/project/${projectId}/time`,
      requiresProject: true,
    },
    {
      label: "Payments",
      icon: CreditCard,
      to: `/project/${projectId}/payments`,
      requiresProject: true,
    },
    {
      label: "Files",
      icon: FolderOpen,
      to: `/project/${projectId}/files`,
      requiresProject: true,
    },
  ];

  const visibleNavItems = navItems.filter(
    (item) => !item.requiresProject || isProjectActive
  );

  return (
    <div className="relative w-14 shrink-0 z-50 h-full">
      <aside 
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={`absolute top-0 left-0 h-full flex bg-gray-50 border-r border-gray-200 transition-all duration-300 ease-in-out overflow-hidden shadow-sm ${
          isExpanded ? "w-56 shadow-xl" : "w-14"
        }`}
      >
        <div className="w-full flex flex-col py-4 gap-1 overflow-hidden"> 
          {/* Project nav items */}
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = 
            currentPath.startsWith(item.to) || 
            (item.label === "Roadmap" && currentPath.includes("/roadmap"));
          return (
            <Link
              key={item.label}
              to={item.to}
              title={!isExpanded ? item.label : undefined}
              className={`flex items-center p-2 mx-2 rounded-lg transition-all overflow-hidden ${
                isActive
                  ? "bg-[#ff9933] text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center w-6 h-6 shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <span 
                className={`text-sm font-medium transition-all duration-300 ml-3 whitespace-nowrap ${
                  isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  </div>
  );
}
