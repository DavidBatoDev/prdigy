import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Briefcase,
  ChevronRight,
  Edit2,
  Mail,
  Plus,
  Save,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import {
  projectService,
  type Project,
  type ProjectMember,
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

const memberInitials = (m: ProjectMember): string =>
  memberDisplayName(m)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const tagStyle = (type: ProjectMember["member_type"]) => {
  switch (type) {
    case "stakeholder":
      return "bg-indigo-50 text-indigo-700 border border-indigo-100";
    case "freelancer":
      return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    case "open_role":
      return "bg-amber-50 text-amber-700 border border-amber-100";
  }
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TeamSkeleton() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 max-w-7xl mx-auto w-full animate-pulse space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-36 rounded bg-gray-200" />
            <div className="h-4 w-52 rounded bg-gray-200" />
          </div>
          <div className="h-9 w-40 rounded-xl bg-gray-200" />
        </div>
        {[3, 4, 2].map((rows, si) => (
          <div
            key={si}
            className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm"
          >
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/40">
              <div className="h-5 w-32 rounded bg-gray-200" />
            </div>
            <div className="divide-y divide-gray-50">
              {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-44 rounded bg-gray-200" />
                    <div className="h-3 w-28 rounded bg-gray-200" />
                  </div>
                  <div className="h-6 w-20 rounded-full bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function MemberAvatar({ member }: { member: ProjectMember }) {
  if (member.user?.avatar_url) {
    return (
      <img
        src={member.user.avatar_url}
        alt={memberDisplayName(member)}
        className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm"
      />
    );
  }
  return (
    <span className="w-9 h-9 rounded-full bg-linear-to-br from-gray-100 to-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center ring-2 ring-white shadow-sm select-none">
      {memberInitials(member)}
    </span>
  );
}

// ─── Inline editable role ─────────────────────────────────────────────────────

function EditableRole({
  memberId,
  projectId,
  role,
  canEdit,
  onSaved,
}: {
  memberId: string;
  projectId: string;
  role: string;
  canEdit: boolean;
  onSaved: (updated: ProjectMember) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(role);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(role);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const cancel = () => {
    setDraft(role);
    setEditing(false);
  };

  const save = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === role) {
      cancel();
      return;
    }
    setSaving(true);
    try {
      const updated = await projectService.updateMember(projectId, memberId, {
        role: trimmed,
      });
      onSaved(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void save();
            if (e.key === "Escape") cancel();
          }}
          disabled={saving}
          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#ff9933]/40 focus:border-[#ff9933] w-44"
        />
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"
          title="Save"
        >
          <Save className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={saving}
          className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100"
          title="Cancel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group/role">
      <span className="text-sm text-gray-700">{role}</span>
      {canEdit && (
        <button
          type="button"
          onClick={startEdit}
          className="opacity-0 group-hover/role:opacity-100 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-opacity"
          title="Edit role title"
        >
          <Edit2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────

function AddMemberModal({
  projectId,
  onClose,
  onAdded,
}: {
  projectId: string;
  onClose: () => void;
  onAdded: (m: ProjectMember) => void;
}) {
  const [tab, setTab] = useState<"email" | "open_role">("email");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const roleVal = role.trim();
    if (!roleVal) {
      setError("Role title is required.");
      return;
    }
    if (tab === "email" && !email.trim()) {
      setError("Email is required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const added = await projectService.addMember(projectId, {
        email: tab === "email" ? email.trim() : undefined,
        role: roleVal,
        member_type: tab === "open_role" ? "open_role" : "freelancer",
      });
      onAdded(added);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add member.");
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

        <div className="flex border-b border-gray-100">
          <button
            type="button"
            onClick={() => setTab("email")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === "email"
                ? "text-[#ff9933] border-b-2 border-[#ff9933] bg-[#ff9933]/5"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Invite by Email
            </div>
          </button>
          <button
            type="button"
            onClick={() => setTab("open_role")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === "open_role"
                ? "text-[#ff9933] border-b-2 border-[#ff9933] bg-[#ff9933]/5"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              Open Role
            </div>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {tab === "email" && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="freelancer@example.com"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff9933]/30 focus:border-[#ff9933] placeholder:text-gray-300"
              />
              <p className="mt-1.5 text-[11px] text-gray-400">
                The person must have a registered Prdigy account.
              </p>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              {tab === "email" ? "Role / Title" : "Role Title"}
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submit();
              }}
              placeholder={
                tab === "email" ? "e.g. Backend Developer" : "e.g. QA Tester"
              }
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff9933]/30 focus:border-[#ff9933] placeholder:text-gray-300"
            />
          </div>

          {tab === "open_role" && (
            <p className="text-[12px] text-gray-400 leading-relaxed bg-amber-50 rounded-lg px-3 py-2.5 border border-amber-100">
              Creates an unfilled seat on your team. You can assign a specific
              person to this role later.
            </p>
          )}

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
            {tab === "email" ? "Add Member" : "Create Open Role"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Member Row ───────────────────────────────────────────────────────────────

function MemberRow({
  member,
  projectId,
  canManage,
  onUpdate,
  onRemove,
}: {
  member: ProjectMember;
  projectId: string;
  canManage: boolean;
  onUpdate: (updated: ProjectMember) => void;
  onRemove: (id: string) => void;
}) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    if (!window.confirm(`Remove "${memberDisplayName(member)}" from the team?`))
      return;
    setRemoving(true);
    try {
      await projectService.removeMember(projectId, member.id);
      onRemove(member.id);
    } finally {
      setRemoving(false);
    }
  };

  if (member.member_type === "open_role") {
    return (
      <div className="flex items-center gap-4 px-6 py-4 group hover:bg-gray-50/60 transition-colors">
        <div className="w-9 h-9 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium text-gray-700">{member.role}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">Unfilled seat</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${tagStyle("open_role")}`}
          >
            Open
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-[#ff9933] hover:text-[#ff9933]/80 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Review Applicants
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          {canManage && (
            <button
              type="button"
              onClick={() => void handleRemove()}
              disabled={removing}
              className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-30"
              title="Remove role"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 px-6 py-4 group hover:bg-gray-50/60 transition-colors">
      <MemberAvatar member={member} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-gray-900 leading-tight">
          {memberDisplayName(member)}
        </p>
        {member.user?.email && (
          <p className="text-[12px] text-gray-400 mt-0.5 truncate">
            {member.user.email}
          </p>
        )}
      </div>
      <div className="shrink-0">
        <EditableRole
          memberId={member.id}
          projectId={projectId}
          role={member.role}
          canEdit={canManage && member.member_type === "freelancer"}
          onSaved={onUpdate}
        />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${tagStyle(member.member_type)}`}
        >
          {member.member_type === "stakeholder" ? "Stakeholder" : "Freelancer"}
        </span>
        {canManage && member.member_type === "freelancer" && (
          <button
            type="button"
            onClick={() => void handleRemove()}
            disabled={removing}
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-30"
            title="Remove member"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  subtitle,
  icon,
  badge,
  members,
  projectId,
  canManage,
  onUpdate,
  onRemove,
  emptyText,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: number;
  members: ProjectMember[];
  projectId: string;
  canManage: boolean;
  onUpdate: (updated: ProjectMember) => void;
  onRemove: (id: string) => void;
  emptyText: string;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/40">
        <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">
              {title}
            </h3>
            {badge !== undefined && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-gray-200 text-[10px] font-bold text-gray-500">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {members.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-[13px] text-gray-400">{emptyText}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {members.map((m) => (
            <MemberRow
              key={m.id}
              member={m}
              projectId={projectId}
              canManage={canManage}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
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

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const p = await projectService.get(projectId);
        if (cancelled) return;
        setProject(p);
        setMembers(
          ((p.members as ProjectMember[]) ?? []).sort((a, b) => {
            const order = { stakeholder: 0, freelancer: 1, open_role: 2 };
            return order[a.member_type] - order[b.member_type];
          }),
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

  const handleAdded = useCallback((m: ProjectMember) => {
    setMembers((prev) => [...prev, m]);
  }, []);

  if (isLoading) return <TeamSkeleton />;

  if (error) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="p-8 max-w-5xl mx-auto">
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const typedProject = project as
    | (Project & { consultant_id?: string; client_id?: string })
    | null;

  const canManage =
    !!user?.id &&
    (user.id === typedProject?.consultant_id ||
      user.id === typedProject?.client_id);

  const stakeholders = members.filter((m) => m.member_type === "stakeholder");
  const freelancers = members.filter((m) => m.member_type === "freelancer");
  const openRoles = members.filter((m) => m.member_type === "open_role");

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 pb-2">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 leading-tight">
              Project Team
            </h1>
            <p className="text-[13px] text-gray-500 mt-1">
              {members.length} member{members.length !== 1 ? "s" : ""}
              {openRoles.length > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <span className="text-amber-600 font-medium">
                    {openRoles.length} open role
                    {openRoles.length !== 1 ? "s" : ""}
                  </span>
                </>
              )}
            </p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#ff9933] hover:bg-[#ff9933]/90 rounded-xl shadow-sm shadow-[#ff9933]/25 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Team Member
            </button>
          )}
        </div>

        {/* Stakeholders */}
        <SectionCard
          title="Stakeholders"
          subtitle="Client & Consultant — project principals"
          icon={<Users className="w-3.5 h-3.5 text-gray-500" />}
          badge={stakeholders.length}
          members={stakeholders}
          projectId={projectId}
          canManage={false}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
          emptyText="No stakeholders on this project yet."
        />

        {/* Execution Team */}
        <SectionCard
          title="Execution Team"
          subtitle="Freelancers actively working on this project"
          icon={<Briefcase className="w-3.5 h-3.5 text-gray-500" />}
          badge={freelancers.length}
          members={freelancers}
          projectId={projectId}
          canManage={canManage}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
          emptyText={
            canManage
              ? "No freelancers yet — add your first team member above."
              : "No freelancers assigned to this project yet."
          }
        />

        {/* Open Roles */}
        <SectionCard
          title="Open Roles"
          subtitle="Unfilled positions available for assignment"
          icon={<User className="w-3.5 h-3.5 text-gray-500" />}
          badge={openRoles.length}
          members={openRoles}
          projectId={projectId}
          canManage={canManage}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
          emptyText={
            canManage
              ? "No open roles — create a slot to list a needed position."
              : "No open roles listed."
          }
        />
      </div>

      {showModal && (
        <AddMemberModal
          projectId={projectId}
          onClose={() => setShowModal(false)}
          onAdded={handleAdded}
        />
      )}
    </div>
  );
}
