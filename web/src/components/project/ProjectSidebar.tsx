import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Map,
  ListChecks,
  Clock,
  CreditCard,
  FolderOpen,
  Home,
} from "lucide-react";
import type { Project } from "@/services/project.service";

interface ProjectSidebarProps {
  project: Project | null;
  projectId: string;
  hasProject?: boolean;
}

export function ProjectSidebar({ project, projectId, hasProject }: ProjectSidebarProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

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
      to: `/project/${projectId}/roadmap`,
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
    <aside className="h-full flex bg-white border-r border-gray-200">
      {/* Icon rail — always visible, matches LeftSidePanel style */}
      <div className="w-14 border-r border-gray-200 bg-gray-50 flex flex-col items-center py-4 gap-1"> 
        {/* Project nav items */}
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath.startsWith(item.to);
          return (
            <Link
              key={item.label}
              to={item.to}
              title={item.label}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                isActive
                  ? "bg-[#ff9933] text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              <Icon className="w-5 h-5" />
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
