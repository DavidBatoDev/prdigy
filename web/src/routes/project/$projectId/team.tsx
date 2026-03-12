import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Edit2,
  Plus,
  Trash2,
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
              <div key={i} className="flex flex-col border border-gray-100 rounded-lg w-40">
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
              <div key={i} className="rounded-lg overflow-hidden border border-gray-100">
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
      <div className="relative shrink-0 overflow-hidden" style={{ paddingBottom: "55%" }}>
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
            <p className="text-[9.5px] text-gray-400 truncate flex-1">{email}</p>
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
          <span className={`inline-flex items-center mt-1.5 self-start px-2 py-0.5 rounded-full text-[9px] font-semibold ${badgeClass}`}>
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


// ─── Edit Role Modal ──────────────────────────────────────────────────────────

function EditRoleModal({
  memberName,
  currentRole,
  onSave,
  onClose,
}: {
  memberName: string;
  currentRole: string;
  onSave: (newRole: string) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(currentRole);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === currentRole) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-[15px] font-bold text-gray-900">Edit Role</h2>
            <p className="text-[12px] text-gray-400 mt-0.5 truncate max-w-[220px]">{memberName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-2">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            Role Title
          </label>
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSave();
              if (e.key === "Escape") onClose();
            }}
            placeholder="e.g. Backend Developer"
            disabled={saving}
            className="w-full text-[14px] border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff9933]/30 focus:border-[#ff9933] placeholder:text-gray-300 transition-colors"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-[13px] font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !draft.trim()}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white bg-[#ff9933] hover:bg-[#ff9933]/90 disabled:opacity-50 transition-colors shadow-sm shadow-[#ff9933]/20"
          >
            {saving && (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            Save Role
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Editable Role badge + pencil trigger ────────────────────────────────────

function EditableRole({
  memberId,
  projectId,
  role,
  memberName,
  canEdit,
  onSaved,
}: {
  memberId: string;
  projectId: string;
  role: string;
  memberName: string;
  canEdit: boolean;
  onSaved: (updated: ProjectMember) => void;
}) {
  const [showModal, setShowModal] = useState(false);

  const handleSave = async (newRole: string) => {
    const updated = await projectService.updateMember(projectId, memberId, {
      role: newRole,
    });
    onSaved(updated);
    setShowModal(false);
  };

  return (
    <>
      <div className="flex items-center gap-1.5 group/role">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 border border-gray-200 truncate max-w-full">
          {role}
        </span>
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="shrink-0 opacity-0 group-hover/role:opacity-100 p-1 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-opacity"
            title="Edit role"
          >
            <Edit2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {showModal && (
        <EditRoleModal
          memberName={memberName}
          currentRole={role}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
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
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const roleVal = role.trim();
    if (!roleVal) { setError("Role title is required."); return; }
    if (!email.trim()) { setError("Email is required."); return; }
    setError(null);
    setSaving(true);
    try {
      await projectService.inviteByEmail(projectId, {
        email: email.trim(),
        role: roleVal,
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
            <h2 className="text-[15px] font-semibold text-gray-900">Add Team Member</h2>
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
              If they already have an account they'll be notified right away.
              If not, they'll get the invite after signup.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Role / Title
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void submit(); }}
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
  onUpdate,
  onRemove,
}: {
  members: ProjectMember[];
  projectId: string;
  canManage: boolean;
  onUpdate: (updated: ProjectMember) => void;
  onRemove: (id: string) => void;
}) {
  const [removing, setRemoving] = useState<string | null>(null);

  const handleRemove = async (member: ProjectMember) => {
    if (
      !window.confirm(`Remove "${memberDisplayName(member)}" from the team?`)
    )
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
                memberId={m.id}
                projectId={projectId}
                role={m.role}
                memberName={memberDisplayName(m)}
                canEdit={canManage}
                onSaved={onUpdate}
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
        const PRINCIPAL_ROLES = new Set(["client", "consultant", "consultant (lead)"]);
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
          onUpdate={handleUpdate}
          onRemove={handleRemove}
        />
      </div>

      {showModal && (
        <AddMemberModal
          projectId={projectId}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
