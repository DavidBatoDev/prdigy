import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Edit2,
  Shield,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  projectService,
  type Project,
  type ProjectMember,
  type ProjectPermissions,
} from "@/services/project.service";
import { useUser } from "@/stores/authStore";

export const Route = createFileRoute("/project/$projectId/team")({
  component: TeamPage,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const memberDisplayName = (m: ProjectMember): string =>
  m.user?.display_name ||
  [m.user?.first_name, m.user?.last_name].filter(Boolean).join(" ") ||
  m.user?.email ||
  "Unknown";

const permissionSections: Array<{
  key: keyof ProjectPermissions;
  title: string;
  items: Array<{ key: string; label: string; hint: string }>;
}> = [
  {
    key: "roadmap",
    title: "Roadmap",
    items: [
      {
        key: "edit",
        label: "Edit",
        hint: "Create, update, reorder, and delete roadmap items.",
      },
      {
        key: "view_internal",
        label: "View Internal",
        hint: "See internal roadmap notes and details.",
      },
      {
        key: "comment",
        label: "Comment",
        hint: "Add and manage comments on roadmap entities.",
      },
      {
        key: "promote",
        label: "Promote",
        hint: "Promote roadmap items between stages.",
      },
    ],
  },
  {
    key: "members",
    title: "Members",
    items: [
      {
        key: "manage",
        label: "Manage",
        hint: "Invite, edit, and remove team members.",
      },
      {
        key: "view",
        label: "View",
        hint: "View team member list and details.",
      },
    ],
  },
  {
    key: "project",
    title: "Project",
    items: [
      {
        key: "settings",
        label: "Settings",
        hint: "Update project-level settings.",
      },
      {
        key: "transfer",
        label: "Transfer",
        hint: "Transfer project ownership or lead context.",
      },
    ],
  },
  {
    key: "time",
    title: "Time",
    items: [
      {
        key: "manage_rates",
        label: "Manage Rates",
        hint: "Configure billable rates and pricing.",
      },
      { key: "view", label: "View", hint: "View time and rate information." },
    ],
  },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TeamSkeleton() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-5 w-full animate-pulse space-y-6">
        {/* header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-36 rounded bg-gray-200" />
            <div className="h-4 w-24 rounded bg-gray-200" />
          </div>
          <div className="h-8 w-36 rounded-xl bg-gray-200" />
        </div>
        {/* principals */}
        <div>
          <div className="h-3 w-28 rounded bg-gray-200 mb-3.5" />
          <div className="flex gap-4">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="flex flex-col border border-gray-100 rounded-lg w-40"
              >
                <div className="w-full pb-[55%] bg-gray-200" />
                <div className="p-2.5 space-y-1.5 bg-white">
                  <div className="h-3 w-20 rounded bg-gray-200" />
                  <div className="h-2 w-14 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* member cards */}
        <div>
          <div className="h-3 w-28 rounded bg-gray-200 mb-3.5" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="rounded-lg overflow-hidden border border-gray-100"
              >
                <div className="w-full pb-[55%] bg-gray-200" />
                <div className="p-2.5 space-y-1.5 bg-white">
                  <div className="h-3 w-20 rounded bg-gray-200" />
                  <div className="h-2 w-14 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
// ─── Person Card (shared) ────────────────────────────────────────────────────

function PersonCard({
  name,
  email,
  avatarUrl,
  badge,
  badgeClass,
  onRemove,
  removing,
  children,
}: {
  name: string;
  email?: string;
  avatarUrl?: string;
  badge?: string;
  badgeClass?: string;
  onRemove?: () => void;
  removing?: boolean;
  children?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative flex flex-col border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white rounded-lg">
      {/* Top — avatar fill (55% aspect) */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{ paddingBottom: "55%" }}
      >
        <div className="absolute inset-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#ff9933]/10">
              <span className="text-2xl font-bold text-[#ff9933]/50 select-none tracking-tight">
                {initials || "?"}
              </span>
            </div>
          )}
        </div>

        {/* Remove button overlay */}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={removing}
            className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-white opacity-0 group-hover:opacity-100 transition-all shadow-sm disabled:opacity-30"
            title="Remove"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Bottom — info */}
      <div className="flex-1 flex flex-col px-2.5 py-2.5 border-t border-gray-100 bg-white">
        <p className="text-[12px] font-semibold text-gray-800 leading-snug truncate">
          {name}
        </p>
        {email && (
          <div className="flex items-center gap-1 mt-0.5 group/email min-w-0">
            <p className="text-[9.5px] text-gray-400 truncate flex-1">
              {email}
            </p>
            <button
              onClick={handleCopyEmail}
              className="shrink-0 p-1 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover/email:opacity-100 transition-opacity focus:opacity-100"
              title="Copy email"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        )}
        {badge && badgeClass && (
          <span
            className={`inline-flex items-center mt-1.5 self-start px-2 py-0.5 rounded-full text-[9px] font-semibold ${badgeClass}`}
          >
            {badge}
          </span>
        )}
        {children && <div className="mt-auto pt-1.5">{children}</div>}
      </div>
    </div>
  );
}

// ─── Principals Card ──────────────────────────────────────────────────────────

function PrincipalsCard({ project }: { project: Project }) {
  const client = project.client;
  const consultant = project.consultant;

  const clientName =
    client?.display_name || client?.email || "No client assigned";
  const consultantName =
    consultant?.display_name || consultant?.email || "No consultant assigned";

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3.5">
        <span className="w-1 h-4 rounded-full bg-[#ff9933]" />
        <p className="text-[12px] font-bold text-gray-700 tracking-wide">
          Project Principals
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <PersonCard
          name={clientName}
          email={client?.email}
          avatarUrl={client?.avatar_url}
          badge="Client"
          badgeClass="bg-gray-100 text-gray-500 border border-gray-200"
        />
        <PersonCard
          name={consultantName}
          email={consultant?.email}
          avatarUrl={consultant?.avatar_url}
          badge="Consultant"
          badgeClass="bg-gray-100 text-gray-500 border border-gray-200"
        />
      </div>
    </div>
  );
}

// ─── Editable Role badge + pencil trigger ────────────────────────────────────

function EditableRole({
  label,
  canEdit,
  onOpenManage,
}: {
  label: string;
  canEdit: boolean;
  onOpenManage: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 border border-gray-200 truncate max-w-full">
          {label}
        </span>
        {canEdit && (
          <>
            <button
              type="button"
              onClick={onOpenManage}
              className="shrink-0 inline-flex items-center gap-1 px-1.5 py-1 rounded-md border border-[#ff9933]/35 bg-[#ff9933]/10 text-[#b45f06] hover:bg-[#ff9933]/20 transition-colors"
              title="Manage role and permissions"
            >
              <Shield className="w-3 h-3" />
              <Edit2 className="w-3 h-3" />
              <span className="text-[9px] font-semibold">Manage</span>
            </button>
          </>
        )}
      </div>
    </>
  );
}

function PermissionsDrawer({
  open,
  member,
  projectId,
  onMemberUpdated,
  onClose,
}: {
  open: boolean;
  member: ProjectMember | null;
  projectId: string;
  onMemberUpdated: (updated: ProjectMember) => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<ProjectPermissions | null>(
    null,
  );
  const [positionDraft, setPositionDraft] = useState("");
  const [entered, setEntered] = useState(false);
  const positionInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setEntered(false);
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open || !member) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      setPermissions(null);
      setPositionDraft(member.position || "");
      try {
        const value = await projectService.getMemberPermissions(
          projectId,
          member.id,
        );
        if (!cancelled) setPermissions(value);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to load permissions.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, member, projectId]);

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => positionInputRef.current?.focus(), 160);
    return () => clearTimeout(id);
  }, [open]);

  const setPermission = (
    section: keyof ProjectPermissions,
    key: string,
    checked: boolean,
  ) => {
    setPermissions((prev) => {
      if (!prev) return prev;
      const group = prev[section] as Record<string, boolean>;
      return {
        ...prev,
        [section]: {
          ...group,
          [key]: checked,
        },
      } as ProjectPermissions;
    });
  };

  const handleSave = async () => {
    if (!member || !permissions) return;
    setSaving(true);
    setError(null);
    try {
      const trimmedPosition = positionDraft.trim();
      if (trimmedPosition.length === 0) {
        throw new Error("Position title is required.");
      }

      const updatedMember = await projectService.updateMember(
        projectId,
        member.id,
        {
          position: trimmedPosition,
        },
      );
      onMemberUpdated(updatedMember);

      const updatedPermissions = await projectService.updateMemberPermissions(
        projectId,
        member.id,
        permissions,
      );
      setPermissions(updatedPermissions);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save permissions.");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !member) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${entered ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
        aria-label="Close permissions panel"
      />
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-[430px] bg-white shadow-2xl border-l border-slate-200 flex flex-col transition-all duration-300 ease-out ${
          entered ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
        }`}
      >
        <div className="px-5 py-4 border-b border-[#ff9933]/25 bg-linear-to-r from-[#fff7ed] to-[#fff3e0]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-[#b45f06]">
                Access Control
              </p>
              <h2 className="text-[18px] font-semibold text-slate-900 mt-0.5">
                Member Permissions
              </h2>
              <p className="text-[12px] text-slate-500 mt-1 truncate">
                {memberDisplayName(member)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white/70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40">
          {!loading && (
            <section className="rounded-xl border border-[#ff9933]/25 bg-white overflow-hidden">
              <header className="px-4 py-3 border-b border-slate-100 bg-[#fffaf2]">
                <h3 className="text-[13px] font-semibold text-slate-800">
                  Role
                </h3>
              </header>
              <div className="px-4 py-3">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Team Position Title
                </label>
                <input
                  ref={positionInputRef}
                  type="text"
                  value={positionDraft}
                  onChange={(e) => setPositionDraft(e.target.value)}
                  placeholder="e.g. Backend Developer"
                  disabled={saving}
                  className="w-full text-[13px] border border-slate-200 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff9933]/30 focus:border-[#ff9933]"
                />
              </div>
            </section>
          )}

          {loading && (
            <>
              {[0, 1, 2].map((idx) => (
                <section
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden animate-pulse"
                >
                  <header className="px-4 py-3 border-b border-slate-100">
                    <div className="h-3.5 w-24 rounded bg-slate-200" />
                  </header>
                  <div className="divide-y divide-slate-100">
                    {[0, 1, 2].map((row) => (
                      <div
                        key={row}
                        className="flex items-start justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="h-3 w-28 rounded bg-slate-200" />
                          <div className="h-2.5 w-44 rounded bg-slate-100" />
                        </div>
                        <div className="h-4 w-4 rounded bg-slate-200 mt-0.5" />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading &&
            permissions &&
            permissionSections.map((section) => (
              <section
                key={section.key}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden"
              >
                <header className="px-4 py-3 border-b border-slate-100">
                  <h3 className="text-[13px] font-semibold text-slate-800">
                    {section.title}
                  </h3>
                </header>
                <div className="divide-y divide-slate-100">
                  {section.items.map((item) => {
                    const group = permissions[section.key] as Record<
                      string,
                      boolean
                    >;
                    const checked = group[item.key] === true;
                    return (
                      <label
                        key={item.key}
                        className="flex items-start justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-slate-800">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {item.hint}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setPermission(
                              section.key,
                              item.key,
                              e.target.checked,
                            )
                          }
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#ff9933] focus:ring-[#ff9933]"
                        />
                      </label>
                    );
                  })}
                </div>
              </section>
            ))}
        </div>

        <footer className="px-5 py-4 border-t border-slate-200 bg-white flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !permissions}
            className="px-3 py-2 text-sm font-semibold text-white bg-[#ff9933] hover:bg-[#e98a25] rounded-md disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </footer>
      </aside>
    </div>
  );
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────

function AddMemberModal({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const positionVal = position.trim();
    if (!positionVal) {
      setError("Position title is required.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await projectService.inviteByEmail(projectId, {
        email: email.trim(),
        position: positionVal,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send invite.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-gray-500" />
            </div>
            <h2 className="text-[15px] font-semibold text-gray-900">
              Add Team Member
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff9933]/30 focus:border-[#ff9933] placeholder:text-gray-300"
            />
            <p className="mt-1.5 text-[11px] text-gray-400">
              If they already have an account they'll be notified right away. If
              not, they'll get the invite after signup.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Position / Title
            </label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submit();
              }}
              placeholder="e.g. Backend Developer"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff9933]/30 focus:border-[#ff9933] placeholder:text-gray-300"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2.5 border border-red-100">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#ff9933] hover:bg-[#ff9933]/90 rounded-lg transition-colors disabled:opacity-50 shadow-sm shadow-[#ff9933]/20"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Add Member
          </button>
        </div>
      </div>
    </div>
  );
}

function MembersTable({
  members,
  projectId,
  canManage,
  onOpenManage,
  onRemove,
}: {
  members: ProjectMember[];
  projectId: string;
  canManage: boolean;
  onOpenManage: (member: ProjectMember) => void;
  onRemove: (id: string) => void;
}) {
  const [removing, setRemoving] = useState<string | null>(null);

  const handleRemove = async (member: ProjectMember) => {
    if (!window.confirm(`Remove "${memberDisplayName(member)}" from the team?`))
      return;
    setRemoving(member.id);
    try {
      await projectService.removeMember(projectId, member.id);
      onRemove(member.id);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-gray-300" />
          <p className="text-[12px] font-bold text-gray-700 tracking-wide">
            Project Members
          </p>
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500">
            {members.length}
          </span>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3">
            <Users className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-[12px] text-gray-400">
            {canManage
              ? "No members yet — add your first team member above."
              : "No members assigned to this project yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {members.map((m) => (
            <PersonCard
              key={m.id}
              name={memberDisplayName(m)}
              email={m.user?.email}
              avatarUrl={m.user?.avatar_url}
              onRemove={canManage ? () => void handleRemove(m) : undefined}
              removing={removing === m.id}
            >
              <EditableRole
                label={m.position?.trim() || "Member"}
                canEdit={canManage}
                onOpenManage={() => onOpenManage(m)}
              />
            </PersonCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function TeamPage() {
  const { projectId } = Route.useParams();
  const user = useUser();

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [permissionMember, setPermissionMember] =
    useState<ProjectMember | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const p = await projectService.get(projectId);
        if (cancelled) return;
        setProject(p);
        const principalIds = new Set(
          [p.client_id, p.consultant_id].filter(Boolean),
        );
        // Exclude principal rows by user_id AND by role name as a safety net
        const PRINCIPAL_ROLES = new Set([
          "client",
          "consultant",
        ]);
        setMembers(
          ((p.members as ProjectMember[]) ?? []).filter(
            (m) =>
              (!m.user_id || !principalIds.has(m.user_id)) &&
              !PRINCIPAL_ROLES.has((m.role ?? "").toLowerCase()),
          ),
        );
      } catch {
        if (!cancelled) setError("Failed to load team data.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const handleUpdate = useCallback((updated: ProjectMember) => {
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }, []);

  const handleRemove = useCallback((id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  if (isLoading) return <TeamSkeleton />;

  if (error) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="px-8 py-6">
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const canManage =
    !!user?.id &&
    (user.id === project?.client_id || user.id === project?.consultant_id);

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-5 w-full space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-bold text-gray-900 leading-tight">
              Project Team
            </h1>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] font-semibold text-white bg-[#ff9933] hover:bg-[#ff9933]/90 rounded-lg shadow-sm shadow-[#ff9933]/25 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Team Member
            </button>
          )}
        </div>

        {/* Principals */}
        {project && <PrincipalsCard project={project} />}

        {/* Styled separator */}
        <div className="relative flex items-center py-2">
          <div className="flex-1 border-t border-dashed border-gray-200" />
          <span className="shrink-0 mx-4 px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest select-none shadow-sm">
            Team Members
          </span>
          <div className="flex-1 border-t border-dashed border-gray-200" />
        </div>

        {/* Members grid — flat, no card wrapper */}
        <MembersTable
          members={members}
          projectId={projectId}
          canManage={canManage}
          onOpenManage={setPermissionMember}
          onRemove={handleRemove}
        />
      </div>

      {showModal && (
        <AddMemberModal
          projectId={projectId}
          onClose={() => setShowModal(false)}
        />
      )}

      <PermissionsDrawer
        open={permissionMember !== null}
        member={permissionMember}
        projectId={projectId}
        onMemberUpdated={handleUpdate}
        onClose={() => setPermissionMember(null)}
      />
    </div>
  );
}
