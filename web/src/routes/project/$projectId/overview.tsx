import { createFileRoute } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Map,
  ListChecks,
  Clock,
  CreditCard,
  FolderOpen,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/project/$projectId/overview")({
  component: OverviewPage,
});

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function QuickLink({
  to,
  icon,
  label,
  description,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-white hover:border-[#ff9933]/40 hover:bg-[#ff9933]/5 transition-all group"
    >
      <div className="w-9 h-9 rounded-lg bg-[#ff9933]/10 flex items-center justify-center text-[#ff9933] shrink-0 group-hover:bg-[#ff9933]/20 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </Link>
  );
}

function OverviewPage() {
  const { projectId } = Route.useParams();

  const stats = [
    { icon: <Map className="w-5 h-5" />, label: "Roadmap Epics", value: "—", color: "#ff9933" },
    { icon: <ListChecks className="w-5 h-5" />, label: "Work Items", value: "—", color: "#e91e63" },
    { icon: <CheckCircle2 className="w-5 h-5" />, label: "Completed Tasks", value: "—", color: "#4caf50" },
    { icon: <TrendingUp className="w-5 h-5" />, label: "Overall Progress", value: "—", color: "#2196f3" },
  ];

  const quickLinks = [
    {
      to: `/project/${projectId}/roadmap`,
      icon: <Map className="w-4 h-4" />,
      label: "Roadmap",
      description: "View the project roadmap and milestones",
    },
    {
      to: `/project/${projectId}/work-items`,
      icon: <ListChecks className="w-4 h-4" />,
      label: "Work Items",
      description: "Browse epics, features and tasks",
    },
    {
      to: `/project/${projectId}/time`,
      icon: <Clock className="w-4 h-4" />,
      label: "Activity Log",
      description: "See what's happened recently",
    },
    {
      to: `/project/${projectId}/payments`,
      icon: <CreditCard className="w-4 h-4" />,
      label: "Payments",
      description: "Manage project payments",
    },
    {
      to: `/project/${projectId}/files`,
      icon: <FolderOpen className="w-4 h-4" />,
      label: "Files",
      description: "Access project documents and files",
    },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <LayoutDashboard className="w-5 h-5 text-[#ff9933]" />
          <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        </div>
        <p className="text-gray-500 text-sm">
          A high-level summary of your project's progress and activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Quick Access */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickLinks.map((link) => (
            <QuickLink key={link.label} {...link} />
          ))}
        </div>
      </div>

      {/* Empty recent activity */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Recent Activity
        </h2>
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <Clock className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No recent activity yet.</p>
        </div>
      </div>
    </div>
  );
}
