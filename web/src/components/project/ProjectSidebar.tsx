import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Map,
  ListChecks,
  Clock,
  CreditCard,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import type { Project } from "@/services/project.service";
import { useProjectSettingsStore } from "@/stores/projectSettingsStore";

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
  
  const isExpanded = useProjectSettingsStore((state) => state.isSidebarExpanded);
  const toggleSidebar = useProjectSettingsStore((state) => state.toggleSidebar);

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
    <aside 
      className={`h-full flex bg-gray-50 border-r border-gray-200 transition-all duration-300 ease-in-out z-10 ${
        isExpanded ? "w-64" : "w-14"
      }`}
    >
      <div className="w-full flex flex-col py-4 gap-1 overflow-hidden"> 
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={`flex items-center gap-3 px-2 py-2 mx-2 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-all ${
            !isExpanded ? "justify-center" : ""
          }`}
          title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isExpanded ? (
            <PanelLeftClose className="w-5 h-5 shrink-0" />
          ) : (
            <PanelLeftOpen className="w-5 h-5 shrink-0" />
          )}
          {isExpanded && (
            <span className="text-sm font-medium whitespace-nowrap">
              Collapse
            </span>
          )}
        </button>

        <div className="h-px bg-gray-200 mx-2 my-2 shrink-0" />

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
              className={`flex items-center gap-3 px-2 py-2 mx-2 rounded-lg transition-all ${
                isActive
                  ? "bg-[#ff9933] text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-200 hover:text-gray-900"
              } ${!isExpanded ? "justify-center" : ""}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {isExpanded && (
                <span className="text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
