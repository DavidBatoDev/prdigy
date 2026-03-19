import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  projectService,
  type Project,
  type ProjectMember,
} from "@/services/project.service";
import { roadmapService } from "@/services/roadmap.service";
import { uploadService } from "@/services/upload.service";
import { useUser } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import {
  OverviewLoadingSkeleton,
  OverviewBanner,
  OverviewContent,
  OverviewSidebar,
  type ProjectBrief,
  type BriefStorageMode,
  type OverviewTimelineItem,
  toRichHtml,
  toItems,
  deriveTimelineItems,
} from "@/components/project/overview";

export const Route = createFileRoute("/project/$projectId/overview")({
  component: OverviewPage,
});

function OverviewPage() {
  const { projectId } = Route.useParams();
  const user = useUser();

  const [project, setProject] = useState<Project | null>(null);
  const [projectBrief, setProjectBrief] = useState<ProjectBrief | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [timelineItems, setTimelineItems] = useState<OverviewTimelineItem[]>([]);
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
  const [projectBannerUrl, setProjectBannerUrl] = useState<string | null>(null);

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
      setProjectBannerUrl(
        (project as Project & { banner_url?: string }).banner_url ?? null,
      );
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
    members.find((member) => member.user_id === user?.id)?.role?.toLowerCase() ?? "";
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
            <OverviewBanner
              bannerUrl={projectBannerUrl}
              canEdit={canEditOverview}
              isUploading={isUploadingBanner}
              isOpen={bannerModalOpen}
              onOpenModal={() => setBannerModalOpen(true)}
              onCloseModal={() => setBannerModalOpen(false)}
              onUpload={(files) => void handleProjectBannerUpload(files)}
            />

            <OverviewContent
              projectTitle={project.title}
              clientName={populatedClient?.display_name}
              consultantName={populatedConsultant?.display_name}
              summaryHtml={summaryHtml}
              scopeHtml={scopeHtml}
              constraintsHtml={constraintsHtml}
              requirementsHtml={requirementsHtml}
              notesHtml={notesHtml}
              risks={risks}
              canEdit={canEditOverview}
              savingSection={savingSection}
              editingSummary={editingSummary}
              editingScope={editingScope}
              editingConstraints={editingConstraints}
              editingRequirements={editingRequirements}
              editingNotes={editingNotes}
              setEditingSummary={setEditingSummary}
              setEditingScope={setEditingScope}
              setEditingConstraints={setEditingConstraints}
              setEditingRequirements={setEditingRequirements}
              setEditingNotes={setEditingNotes}
              onSaveSummary={(value) =>
                saveBriefPatch("summary", { mission_vision: value })
              }
              onSaveScope={(value) =>
                saveBriefPatch("scope", { scope_statement: value })
              }
              onSaveConstraints={(value) =>
                saveBriefPatch("constraints", { constraints: value })
              }
              onSaveRequirements={(value) =>
                saveBriefPatch("requirements", { requirements: { html: value } })
              }
              onSaveNotes={(value) =>
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
          </div>

          <OverviewSidebar
            timelineItems={timelineItems}
            members={members}
          />
        </div>
      </div>
    </div>
  );
}
