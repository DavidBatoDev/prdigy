import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Settings, Users } from "lucide-react";

interface ProjectSettingsLayoutProps {
  projectId: string;
  children: ReactNode;
}

export function ProjectSettingsLayout({
  projectId,
  children,
}: ProjectSettingsLayoutProps) {
  const currentPath = useRouterState({
    select: (state) => state.location.pathname,
  });

  const navItems = [
    {
      label: "General",
      to: `/project/${projectId}/settings/general`,
      icon: Settings,
      active: currentPath === `/project/${projectId}/settings/general`,
    },
    {
      label: "Team",
      to: `/project/${projectId}/settings/team`,
      icon: Users,
      active: currentPath === `/project/${projectId}/settings/team`,
    },
  ];

  return (
    <div className="h-full min-h-0 flex flex-col bg-[#f8f8f8] overflow-hidden">
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <aside className="hidden md:flex h-full w-[260px] shrink-0 border-r border-gray-200 bg-[#f5f5f5]">
          <div className="w-full overflow-y-auto">
            <div className="px-7 pt-7 pb-5 border-b border-gray-200">
              <h1 className="text-[34px] leading-none font-semibold text-gray-900">
                Settings
              </h1>
            </div>

            <div className="px-5 py-5">
              <p className="px-2 pb-3 text-[11px] font-semibold tracking-[0.14em] uppercase text-gray-500">
                Configuration
              </p>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        item.active
                          ? "bg-[#e9e9e9] text-gray-900"
                          : "text-gray-700 hover:bg-[#ececec]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-[980px] px-6 md:px-10 py-8 md:py-10">
            <div className="mb-8 md:hidden">
              <h1 className="text-[24px] leading-tight font-semibold text-gray-900">
                Settings
              </h1>
              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-2">
                <nav className="grid grid-cols-2 gap-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={`mobile-${item.label}`}
                        to={item.to}
                        className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                          item.active
                            ? "bg-gray-900 text-white"
                            : "text-gray-700 bg-gray-100"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>

            <div className="min-w-0">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
