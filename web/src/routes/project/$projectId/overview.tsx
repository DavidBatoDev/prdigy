import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Circle,
  Edit2,
  ImagePlus,
  Loader2,
  Save,
  Shield,
  StickyNote,
  User,
  X,
} from "lucide-react";
import {
  projectService,
  type Project,
  type ProjectMember,
} from "@/services/project.service";
import { roadmapService } from "@/services/roadmap.service";
import { uploadService } from "@/services/upload.service";
import { UploadModal } from "@/components/profile/UploadModal";
import { RichTextEditor } from "@/components/common/RichTextEditor";
import { cleanHTML } from "@/components/common/RichTextEditor/utils/formatting";
import { useUser } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import type {
  Roadmap,
  RoadmapEpic,
  RoadmapFeature,
  RoadmapMilestone,
  RoadmapTask,
} from "@/types/roadmap";

export const Route = createFileRoute("/project/$projectId/overview")({
  component: OverviewPage,
});

type ProjectBrief = {
  mission_vision?: string | null;
  scope_statement?: string | null;
  requirements?: unknown;
  constraints?: string | null;
  risk_register?: unknown;
  visibility_mask?: Record<string, unknown> | null;
  notes?: string | null;
};

type BriefStorageMode = "visibility_mask" | "notes" | "none";

type OverviewTimelineItem = {
  id: string;
  title: string;
  target_date: string;
  status: RoadmapMilestone["status"];
  kind: "epic" | "feature" | "task";
};

const MAX_OVERVIEW_MILESTONES = 6;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const toRichHtml = (raw: unknown): string => {
  if (raw == null) return "";

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return "";

    if (/<[a-z][\s\S]*>/i.test(trimmed)) {
      return cleanHTML(trimmed);
    }

    return `<p>${escapeHtml(trimmed).replace(/\n/g, "<br>")}</p>`;
  }

  if (Array.isArray(raw)) {
    const items = toItems(raw);
    if (items.length === 0) return "";
    return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }

  if (typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    if (typeof record.html === "string") {
      return cleanHTML(record.html);
    }
    if (typeof record.text === "string") {
      const text = record.text.trim();
      return text ? `<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>` : "";
    }
  }

  return "";
};

interface EditableRichSectionProps {
  value: string;
  placeholder: string;
  emptyText: string;
  isSaving: boolean;
  isEditing: boolean;
  onEditingChange: (isEditing: boolean) => void;
  onSave: (value: string) => Promise<void>;
}

function EditableRichSection({
  value,
  placeholder,
  emptyText,
  isSaving,
  isEditing,
  onEditingChange,
  onSave,
}: EditableRichSectionProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!isEditing) {
      setDraft(value);
    }
  }, [value, isEditing]);

  const handleSave = async () => {
    await onSave(cleanHTML(draft));
    onEditingChange(false);
  };

  const hasContent = Boolean(value.trim());

  if (isEditing) {
    return (
      <div className="space-y-3">
        <RichTextEditor
          value={draft}
          onChange={setDraft}
          placeholder={placeholder}
          minHeight="120px"
          maxHeight="320px"
          tools={[
            "textFormat",
            "bold",
            "italic",
            "more",
            "separator",
            "bulletList",
            "numberedList",
            "separator",
            "link",
          ]}
          disabled={isSaving}
          autoFocus
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(value);
              onEditingChange(false);
            }}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hasContent ? (
        <div
          className="text-[13px] text-gray-600 leading-6 max-w-none wrap-break-word [&_p]:my-0 [&_p+_p]:mt-3 [&_a]:text-blue-600 [&_a]:underline [&_strong]:font-semibold [&_b]:font-semibold [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1"
          dangerouslySetInnerHTML={{ __html: value }}
        />
      ) : (
        <p className="text-[13px] text-gray-500">{emptyText}</p>
      )}
    </div>
  );
}

const milestoneState = (status: RoadmapMilestone["status"]) => {
  switch (status) {
    case "completed":
      return {
        dot: "bg-blue-500 border-blue-500 text-white",
        icon: CheckCircle2,
        title: "text-blue-700",
      };
    case "in_progress":
      return {
        dot: "bg-blue-100 border-blue-400 text-blue-600",
        icon: Circle,
        title: "text-blue-700",
      };
    case "at_risk":
      return {
        dot: "bg-amber-100 border-amber-400 text-amber-600",
        icon: AlertTriangle,
        title: "text-amber-700",
      };
    case "missed":
      return {
        dot: "bg-red-100 border-red-400 text-red-600",
        icon: AlertTriangle,
        title: "text-red-700",
      };
    case "not_started":
    default:
      return {
        dot: "bg-gray-100 border-gray-300 text-gray-400",
        icon: Circle,
        title: "text-gray-700",
      };
  }
};

const nameFromMember = (member: ProjectMember) => {
  return (
    member.user?.display_name ||
    [member.user?.first_name, member.user?.last_name]
      .filter(Boolean)
      .join(" ") ||
    member.user?.email ||
    member.role
  );
};

const toItems = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const candidate =
          (item as Record<string, unknown>).title ??
          (item as Record<string, unknown>).name ??
          (item as Record<string, unknown>).text;
        if (typeof candidate === "string") return candidate;
      }
      return null;
    })
    .filter((value): value is string => Boolean(value));
};

const isPastDate = (value?: string) => {
  if (!value) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return parsed < now;
};

const mapTaskStatus = (task: RoadmapTask): RoadmapMilestone["status"] => {
  if (task.status === "done") return "completed";
  if (task.status === "blocked") return "at_risk";
  if (task.status === "in_progress" || task.status === "in_review") {
    return "in_progress";
  }
  if (isPastDate(task.due_date)) return "missed";
  return "not_started";
};

const mapFeatureStatus = (
  feature: RoadmapFeature,
): RoadmapMilestone["status"] => {
  if (feature.status === "completed") return "completed";
  if (feature.status === "blocked") return "at_risk";
  if (feature.status === "in_progress" || feature.status === "in_review") {
    return "in_progress";
  }
  if (isPastDate(feature.end_date)) return "missed";
  return "not_started";
};

const mapEpicStatus = (epic: RoadmapEpic): RoadmapMilestone["status"] => {
  if (epic.status === "completed") return "completed";
  if (epic.status === "on_hold") return "at_risk";
  if (epic.status === "in_progress" || epic.status === "in_review") {
    return "in_progress";
  }
  if (isPastDate(epic.end_date)) return "missed";
  return "not_started";
};

const deriveTimelineItems = (
  roadmap: Roadmap | null,
): OverviewTimelineItem[] => {
  if (!roadmap?.epics?.length) return [];

  const items: OverviewTimelineItem[] = [];

  for (const epic of roadmap.epics) {
    const epicDate = epic.end_date ?? epic.start_date;
    if (epicDate) {
      items.push({
        id: `epic-${epic.id}`,
        title: epic.title,
        target_date: epicDate,
        status: mapEpicStatus(epic),
        kind: "epic",
      });
    }

    for (const feature of epic.features ?? []) {
      const featureDate = feature.end_date ?? feature.start_date;
      if (featureDate) {
        items.push({
          id: `feature-${feature.id}`,
          title: feature.title,
          target_date: featureDate,
          status: mapFeatureStatus(feature),
          kind: "feature",
        });
      }

      for (const task of feature.tasks ?? []) {
        if (!task.due_date) continue;
        items.push({
          id: `task-${task.id}`,
          title: task.title,
          target_date: task.due_date,
          status: mapTaskStatus(task),
          kind: "task",
        });
      }
    }
  }

  return items.sort(
    (a, b) =>
      new Date(a.target_date).getTime() - new Date(b.target_date).getTime(),
  );
};

function OverviewLoadingSkeleton() {
  return (
    <div className="h-full overflow-y-auto px-8 py-8 w-full animate-pulse">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-10">
        <div className="space-y-8">
          <header className="pb-1 space-y-3">
            <div className="h-10 w-80 max-w-full rounded bg-gray-200" />
            <div className="h-4 w-72 max-w-full rounded bg-gray-200" />
          </header>

          <section className="pb-7 border-b border-gray-200 space-y-4">
            <div className="h-6 w-44 rounded bg-gray-200" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-[92%] rounded bg-gray-200" />
              <div className="h-4 w-[84%] rounded bg-gray-200" />
            </div>
          </section>

          <section className="pb-7 border-b border-gray-200 space-y-4">
            <div className="h-6 w-52 rounded bg-gray-200" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-[88%] rounded bg-gray-200" />
              <div className="h-4 w-[76%] rounded bg-gray-200" />
            </div>
          </section>

          <section className="pb-7 border-b border-gray-200 space-y-4">
            <div className="h-6 w-44 rounded bg-gray-200" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-[90%] rounded bg-gray-200" />
            </div>
          </section>

          <section className="pb-7 border-b border-gray-200 space-y-4">
            <div className="h-6 w-40 rounded bg-gray-200" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-[85%] rounded bg-gray-200" />
            </div>
          </section>
        </div>

        <aside className="border-l border-gray-300 pl-8 space-y-8 sticky top-6 self-start">
          <div>
            <div className="h-6 w-28 rounded bg-gray-200 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                  <div className="space-y-2 w-full">
                    <div className="h-4 w-[85%] rounded bg-gray-200" />
                    <div className="h-3 w-24 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="h-6 w-28 rounded bg-gray-200 mb-3" />
            <div className="flex items-center gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className={`w-9 h-9 rounded-full bg-gray-200 ${index > 0 ? "-ml-2" : ""}`}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function OverviewPage() {
  const { projectId } = Route.useParams();
  const user = useUser();
  const [project, setProject] = useState<Project | null>(null);
  const [projectBrief, setProjectBrief] = useState<ProjectBrief | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [timelineItems, setTimelineItems] = useState<OverviewTimelineItem[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<
    "summary" | "scope" | "constraints" | "requirements" | "notes" | null
  >(null);
  const [briefStorageMode, setBriefStorageMode] =
    useState<BriefStorageMode>("visibility_mask");
  const [editingSummary, setEditingSummary] = useState(false);
  const [editingScope, setEditingScope] = useState(false);
  const [editingConstraints, setEditingConstraints] = useState(false);
  const [editingRequirements, setEditingRequirements] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [projectBannerUrl, setProjectBannerUrl] = useState<string | null>(
    null,
  );

  const briefSelectBase =
    "mission_vision, scope_statement, requirements, constraints, risk_register";

  const isMissingColumnError = (error: unknown, column: string) => {
    if (!error || typeof error !== "object") return false;
    const err = error as { message?: string; details?: string; hint?: string };
    const text =
      `${err.message ?? ""} ${err.details ?? ""} ${err.hint ?? ""}`.toLowerCase();
    return text.includes(column.toLowerCase());
  };

  const fetchProjectBrief = async (): Promise<{
    brief: ProjectBrief | null;
    mode: BriefStorageMode;
  }> => {
    const withVisibility = await supabase
      .from("project_briefs")
      .select(`${briefSelectBase}, visibility_mask`)
      .eq("project_id", projectId)
      .maybeSingle();

    if (!withVisibility.error) {
      return {
        brief: (withVisibility.data as ProjectBrief | null) ?? null,
        mode: "visibility_mask",
      };
    }

    if (!isMissingColumnError(withVisibility.error, "visibility_mask")) {
      throw withVisibility.error;
    }

    const withNotes = await supabase
      .from("project_briefs")
      .select(`${briefSelectBase}, notes`)
      .eq("project_id", projectId)
      .maybeSingle();

    if (!withNotes.error) {
      return {
        brief: (withNotes.data as ProjectBrief | null) ?? null,
        mode: "notes",
      };
    }

    if (!isMissingColumnError(withNotes.error, "notes")) {
      throw withNotes.error;
    }

    const baseOnly = await supabase
      .from("project_briefs")
      .select(briefSelectBase)
      .eq("project_id", projectId)
      .maybeSingle();

    if (baseOnly.error) {
      throw baseOnly.error;
    }

    return {
      brief: (baseOnly.data as ProjectBrief | null) ?? null,
      mode: "none",
    };
  };

  const fetchProjectFallback = async (): Promise<Project> => {
    const { data, error: projectError } = await supabase
      .from("projects")
      .select(
        "id, title, description, status, banner_url, client_id, consultant_id, created_at, updated_at, client:profiles!projects_client_id_fkey(id, display_name, avatar_url, email), consultant:profiles!projects_consultant_id_fkey(id, display_name, avatar_url, email)",
      )
      .eq("id", projectId)
      .single();

    if (projectError || !data) {
      throw projectError ?? new Error("Project not found");
    }

    return data as unknown as Project;
  };

  const fetchProjectMembersFallback = async (): Promise<ProjectMember[]> => {
    const { data, error: membersError } = await supabase
      .from("project_members")
      .select(
        "id, project_id, user_id, role, joined_at, user:profiles(id, display_name, avatar_url, email, first_name, last_name)",
      )
      .eq("project_id", projectId);

    if (membersError) return [];
    return (data as unknown as ProjectMember[]) ?? [];
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const projectData = await projectService
          .get(projectId)
          .catch(() => fetchProjectFallback());
        const projectMembers = await projectService
          .getMembers(projectId)
          .catch(() => fetchProjectMembersFallback());

        const [briefResultSettled, roadmapSettled] = await Promise.allSettled([
          fetchProjectBrief(),
          roadmapService.getByProjectId(projectId),
        ]);

        const briefResult =
          briefResultSettled.status === "fulfilled"
            ? briefResultSettled.value
            : { brief: null, mode: "none" as BriefStorageMode };

        const roadmap =
          roadmapSettled.status === "fulfilled" ? roadmapSettled.value : null;

        let derivedTimeline: OverviewTimelineItem[] = [];
        if (roadmap) {
          try {
            const full = await roadmapService.getFull(roadmap.id);
            derivedTimeline = deriveTimelineItems(full);
          } catch {
            derivedTimeline = [];
          }
        }

        if (cancelled) return;
        setProject(projectData);
        setMembers(projectMembers);
        setProjectBrief(briefResult.brief);
        setBriefStorageMode(briefResult.mode);
        setTimelineItems(derivedTimeline);
      } catch {
        if (!cancelled) setError("Failed to load overview data.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Sync projectBannerUrl from loaded project
  useEffect(() => {
    if (project) {
      setProjectBannerUrl((project as Project & { banner_url?: string }).banner_url ?? null);
    }
  }, [project]);

  const handleProjectBannerUpload = async (files: File[]) => {
    if (!files[0]) return;
    setIsUploadingBanner(true);
    try {
      const url = await uploadService.uploadProjectBanner(projectId, files[0]);
      setProjectBannerUrl(url);
      setBannerModalOpen(false);
    } catch (e) {
      console.error("Project banner upload failed", e);
      alert("Failed to upload banner. Please try again.");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const risks = useMemo(
    () => toItems(projectBrief?.risk_register),
    [projectBrief?.risk_register],
  );
  const populatedClient = (
    project as
      | (Project & {
          client?: { display_name?: string };
          consultant?: { display_name?: string };
        })
      | null
  )?.client;
  const populatedConsultant = (
    project as
      | (Project & {
          client?: { display_name?: string };
          consultant?: { display_name?: string };
        })
      | null
  )?.consultant;

  const memberRole =
    members
      .find((member) => member.user_id === user?.id)
      ?.role?.toLowerCase() ?? "";
  const canEditOverview =
    memberRole.includes("client") || memberRole.includes("consultant");

  const summaryHtml = toRichHtml(
    projectBrief?.mission_vision ?? project?.description ?? "",
  );
  const scopeHtml = toRichHtml(projectBrief?.scope_statement ?? "");
  const constraintsHtml = toRichHtml(projectBrief?.constraints ?? "");
  const requirementsHtml = toRichHtml(projectBrief?.requirements);
  const notesHtml = toRichHtml(
    projectBrief?.visibility_mask?.project_notes ?? projectBrief?.notes ?? "",
  );
  const visibleTimelineItems = useMemo(
    () => timelineItems.slice(0, MAX_OVERVIEW_MILESTONES),
    [timelineItems],
  );

  const saveBriefPatch = async (
    section: "summary" | "scope" | "constraints" | "requirements" | "notes",
    patch: Partial<ProjectBrief>,
  ) => {
    if (!canEditOverview) return;

    try {
      setSavingSection(section);

      const nextVisibilityMask = {
        ...(projectBrief?.visibility_mask ?? {}),
        ...(patch.visibility_mask ?? {}),
      };

      const payloadBase = {
        project_id: projectId,
        version: 1,
        updated_by: user?.id ?? null,
        ...patch,
      };

      const runUpsert = async (mode: BriefStorageMode) => {
        if (mode === "visibility_mask") {
          return supabase
            .from("project_briefs")
            .upsert(
              {
                ...payloadBase,
                visibility_mask: nextVisibilityMask,
              },
              { onConflict: "project_id,version" },
            )
            .select(`${briefSelectBase}, visibility_mask`)
            .single();
        }

        if (mode === "notes") {
          return supabase
            .from("project_briefs")
            .upsert(payloadBase, { onConflict: "project_id,version" })
            .select(`${briefSelectBase}, notes`)
            .single();
        }

        return supabase
          .from("project_briefs")
          .upsert(payloadBase, { onConflict: "project_id,version" })
          .select(briefSelectBase)
          .single();
      };

      let result = await runUpsert(briefStorageMode);

      if (result.error && briefStorageMode === "visibility_mask") {
        if (isMissingColumnError(result.error, "visibility_mask")) {
          if (patch.visibility_mask?.project_notes !== undefined) {
            patch.notes = String(patch.visibility_mask.project_notes ?? "");
            delete patch.visibility_mask;
          }
          result = await runUpsert("notes");
          if (result.error && isMissingColumnError(result.error, "notes")) {
            result = await runUpsert("none");
            if (!result.error) setBriefStorageMode("none");
          } else if (!result.error) {
            setBriefStorageMode("notes");
          }
        }
      }

      if (result.error && briefStorageMode === "notes") {
        if (isMissingColumnError(result.error, "notes")) {
          result = await runUpsert("none");
          if (!result.error) setBriefStorageMode("none");
        }
      }

      const { data, error: updateError } = result;

      if (updateError) {
        throw updateError;
      }

      setProjectBrief((data as ProjectBrief | null) ?? null);
    } catch {
      alert("Failed to save changes. Please try again.");
    } finally {
      setSavingSection(null);
    }
  };

  if (isLoading) {
    return <OverviewLoadingSkeleton />;
  }

  if (error || !project) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? "Project not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto w-full">
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-10">
        <div className="flex flex-col">
          {/* Project Banner */}
          <div className="relative w-full h-40 bg-linear-to-br from-gray-800 via-gray-700 to-gray-900 overflow-hidden rounded-xl mb-8">
            {projectBannerUrl && (
              <img
                src={projectBannerUrl}
                alt="Project banner"
                className="w-full h-full object-cover"
              />
            )}
            {canEditOverview && (
              <button
                type="button"
                onClick={() => setBannerModalOpen(true)}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs font-medium bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                {projectBannerUrl ? "Change banner" : "Add banner"}
              </button>
            )}
          </div>

          {/* Banner Upload Modal */}
          <UploadModal
            isOpen={bannerModalOpen}
            onClose={() => setBannerModalOpen(false)}
            title="Project Banner"
            accept="image/jpeg,image/png,image/webp"
            maxFiles={1}
            maxSizeMb={10}
            aspectHint="4:1 (wide)"
            onUpload={(files) => void handleProjectBannerUpload(files)}
            isUploading={isUploadingBanner}
          />

          <div className="space-y-8">
          <header className="pb-1">
            <h1 className="text-[28px] font-semibold text-gray-900 uppercase tracking-wide leading-tight">
              {project.title}
            </h1>
            <p className="mt-2 text-[13px] text-gray-500 font-medium">
              Client: {populatedClient?.display_name ?? "—"}
              <span className="mx-2">|</span>
              Consultant: {populatedConsultant?.display_name ?? "—"}
            </p>
          </header>

          <section className="pb-7 border-b border-gray-200">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                <h2 className="text-[18px] font-semibold text-gray-900">
                  Project Summary
                </h2>
              </div>
              {canEditOverview && !editingSummary && (
                <button
                  type="button"
                  onClick={() => setEditingSummary(true)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
            <EditableRichSection
              value={summaryHtml}
              placeholder="Write the project summary..."
              emptyText="No summary added yet."
              isSaving={savingSection === "summary"}
              isEditing={editingSummary}
              onEditingChange={setEditingSummary}
              onSave={(value) =>
                saveBriefPatch("summary", { mission_vision: value })
              }
            />
          </section>

          <section className="pb-7 border-b border-gray-200">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" />
                <h2 className="text-[18px] font-semibold text-gray-900">
                  Scope & Constraints
                </h2>
              </div>
              {canEditOverview && !editingScope && !editingConstraints && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingScope(true);
                    setEditingConstraints(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
            <div className="text-[13px] text-gray-600 leading-6 space-y-3">
              <EditableRichSection
                value={scopeHtml}
                placeholder="Write the scope statement..."
                emptyText="No scope statement added yet."
                isSaving={savingSection === "scope"}
                isEditing={editingScope}
                onEditingChange={setEditingScope}
                onSave={(value) =>
                  saveBriefPatch("scope", { scope_statement: value })
                }
              />
              <div className="bg-gray-100/70 px-3 py-2.5 text-[12px] leading-5 text-gray-700">
                <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1.5 font-semibold">
                  Constraints
                </p>
                <EditableRichSection
                  value={constraintsHtml}
                  placeholder="Write constraints..."
                  emptyText="No constraints added yet."
                  isSaving={savingSection === "constraints"}
                  isEditing={editingConstraints}
                  onEditingChange={setEditingConstraints}
                  onSave={(value) =>
                    saveBriefPatch("constraints", { constraints: value })
                  }
                />
              </div>
            </div>
          </section>

          <section className="pb-7 border-b border-gray-200">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                <h2 className="text-[18px] font-semibold text-gray-900">
                  Core Requirements
                </h2>
              </div>
              {canEditOverview && !editingRequirements && (
                <button
                  type="button"
                  onClick={() => setEditingRequirements(true)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
            <EditableRichSection
              value={requirementsHtml}
              placeholder="Describe core requirements..."
              emptyText="No requirements listed yet."
              isSaving={savingSection === "requirements"}
              isEditing={editingRequirements}
              onEditingChange={setEditingRequirements}
              onSave={(value) =>
                saveBriefPatch("requirements", {
                  requirements: { html: value },
                })
              }
            />
          </section>

          <section className="pb-7 border-b border-gray-200">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-indigo-500" />
                <h2 className="text-[18px] font-semibold text-gray-900">
                  Project Notes
                </h2>
              </div>
              {canEditOverview && !editingNotes && (
                <button
                  type="button"
                  onClick={() => setEditingNotes(true)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
            <EditableRichSection
              value={notesHtml}
              placeholder="Write project notes..."
              emptyText="No notes added yet."
              isSaving={savingSection === "notes"}
              isEditing={editingNotes}
              onEditingChange={setEditingNotes}
              onSave={(value) =>
                saveBriefPatch(
                  "notes",
                  briefStorageMode === "visibility_mask"
                    ? {
                        visibility_mask: {
                          ...(projectBrief?.visibility_mask ?? {}),
                          project_notes: value,
                        },
                      }
                    : { notes: value },
                )
              }
            />
          </section>

          <section className="pb-2">
            <div className="flex items-center gap-2 mb-2.5">
              <AlertTriangle className="w-4 h-4 text-indigo-500" />
              <h2 className="text-[18px] font-semibold text-gray-900">
                Risk Register
              </h2>
            </div>
            {risks.length > 0 ? (
              <ul className="space-y-1.5 text-[13px] text-gray-700">
                {risks.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-gray-500">No risks logged yet.</p>
            )}
          </section>
          </div>
        </div>

        <aside className="border-l border-gray-300 pl-8 space-y-8 sticky top-6 self-start">
          <div>
            <h2 className="text-[16px] font-semibold text-gray-900 mb-4">
              Milestones
            </h2>
            {timelineItems.length === 0 ? (
              <p className="text-[13px] text-gray-500">
                No timeline checkpoints yet.
              </p>
            ) : (
              <div className="space-y-0">
                {visibleTimelineItems.map((item, index) => {
                  const style = milestoneState(item.status);
                  const DotIcon = style.icon;
                  return (
                    <div key={item.id} className="relative pl-9 pb-5 last:pb-0">
                      {index < visibleTimelineItems.length - 1 && (
                        <span className="absolute left-[15px] top-7 bottom-0 w-px bg-gray-200" />
                      )}
                      <span
                        className={`absolute left-0 top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${style.dot}`}
                      >
                        <DotIcon className="w-4 h-4" />
                      </span>
                      <p
                        className={`text-[14px] font-semibold leading-5 ${style.title}`}
                      >
                        {item.title}
                      </p>
                      <p className="text-[12px] text-gray-500 mt-1 inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(item.target_date).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}
                        <span className="uppercase tracking-wide text-[10px] text-gray-400">
                          {item.kind}
                        </span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-[16px] font-semibold text-gray-900 mb-3">
              Project Team
            </h2>
            {members.length === 0 ? (
              <p className="text-[13px] text-gray-500">No members yet.</p>
            ) : (
              <div className="flex items-center gap-2">
                {members.slice(0, 6).map((member, index) => (
                  <div
                    key={member.id}
                    className={index > 0 ? "-ml-2" : ""}
                    title={`${nameFromMember(member)} (${member.role})`}
                  >
                    {member.user?.avatar_url ? (
                      <img
                        src={member.user.avatar_url}
                        alt={nameFromMember(member)}
                        className="w-9 h-9 rounded-full border-2 border-white object-cover"
                      />
                    ) : (
                      <span className="w-9 h-9 rounded-full border-2 border-white bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                ))}
                {members.length > 6 && (
                  <span className="-ml-2 w-9 h-9 rounded-full border-2 border-white bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">
                    +{members.length - 6}
                  </span>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  </div>
  );
}
