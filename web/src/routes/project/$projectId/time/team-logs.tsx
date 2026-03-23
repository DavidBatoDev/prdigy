import {
  Outlet,
  createFileRoute,
  useChildMatches,
  useNavigate,
} from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProjectMember } from "@/services/project.service";
import {
  projectTimeService,
  type ProjectMemberTimeRate,
} from "@/services/project-time.service";
import { TeamRatesSection } from "@/components/project/time/TeamRatesSection";
import {
  AddRateModal,
  DeleteRateModal,
  EditRateModal,
} from "@/components/project/time/TimeModals";
import { TimeRouteFrame } from "@/components/project/time/TimeRouteFrame";
import {
  getErrorMessage,
  projectTimeKeys,
} from "@/queries/project-time";
import {
  MY_LOGS_LIMIT,
  MY_LOGS_PAGE,
  useTimeRouteData,
} from "@/components/project/time/useTimeRouteData";

export const Route = createFileRoute("/project/$projectId/time/team-logs")({
  component: TimeTeamLogsPage,
});

function TimeTeamLogsPage() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }

  return <TimeTeamLogsIndexPage />;
}

function TimeTeamLogsIndexPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    actorKey,
    actorUserId,
    canManageRates,
    canViewTeamLogs,
    canShowMyLogsTab,
    loadingPermissions,
    loadingRates,
    loadingMembers,
    rates,
    teamMembers,
    queryErrorMessage,
    showMyLogsTabSkeleton,
    shouldShowAccessDenied,
  } = useTimeRouteData(projectId, {
    includeOwnRate: false,
    includeRates: true,
    includeTeamMembers: true,
  });

  const [error, setError] = useState<string | null>(null);

  const [isAddRateModalOpen, setIsAddRateModalOpen] = useState(false);
  const [newRateMemberId, setNewRateMemberId] = useState("");
  const [newRateCustomId, setNewRateCustomId] = useState("");
  const [newRateValue, setNewRateValue] = useState("");
  const [newRateCurrency, setNewRateCurrency] = useState("USD");
  const [newRateStartDate, setNewRateStartDate] = useState("");
  const [newRateEndDate, setNewRateEndDate] = useState("");

  const [isEditRateModalOpen, setIsEditRateModalOpen] = useState(false);
  const [isDeleteRateModalOpen, setIsDeleteRateModalOpen] = useState(false);
  const [deleteRateVerificationText, setDeleteRateVerificationText] = useState("");
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [editingRateCustomId, setEditingRateCustomId] = useState("");
  const [editingRateValue, setEditingRateValue] = useState("");
  const [editingRateCurrency, setEditingRateCurrency] = useState("USD");
  const [editingRateStartDate, setEditingRateStartDate] = useState("");
  const [editingRateEndDate, setEditingRateEndDate] = useState("");

  const invalidateMyLogs = () =>
    queryClient.invalidateQueries({
      queryKey: projectTimeKeys.myLogs(
        projectId,
        actorKey,
        MY_LOGS_PAGE,
        MY_LOGS_LIMIT,
      ),
    });

  const invalidateRates = () =>
    queryClient.invalidateQueries({
      queryKey: projectTimeKeys.rates(projectId, actorKey),
    });

  const invalidateOwnRate = () =>
    queryClient.invalidateQueries({
      queryKey: projectTimeKeys.myRate(projectId, actorKey),
    });

  const invalidateTeamMembers = () =>
    queryClient.invalidateQueries({
      queryKey: projectTimeKeys.teamMembers(projectId, actorKey),
    });

  const createRateMutation = useMutation({
    mutationFn: (payload: {
      project_member_id: string;
      hourly_rate: number;
      currency: string;
      custom_id: string;
      start_date: string;
      end_date?: string;
    }) => projectTimeService.createProjectMemberRate(projectId, payload),
    onSuccess: async () => {
      await Promise.all([
        invalidateRates(),
        invalidateOwnRate(),
        invalidateMyLogs(),
        invalidateTeamMembers(),
      ]);
    },
  });

  const updateRateMutation = useMutation({
    mutationFn: ({
      rateId,
      payload,
    }: {
      rateId: string;
      payload: {
        hourly_rate: number;
        currency: string;
        custom_id: string;
        start_date: string;
        end_date?: string;
      };
    }) => projectTimeService.updateProjectMemberRate(projectId, rateId, payload),
    onSuccess: async () => {
      await Promise.all([invalidateRates(), invalidateOwnRate(), invalidateMyLogs()]);
    },
  });

  const deleteRateMutation = useMutation({
    mutationFn: (rateId: string) =>
      projectTimeService.deleteProjectMemberRate(projectId, rateId),
    onSuccess: async () => {
      await Promise.all([
        invalidateRates(),
        invalidateOwnRate(),
        invalidateMyLogs(),
        invalidateTeamMembers(),
      ]);
    },
  });

  const membersWithoutRate = useMemo(() => {
    const userIdsWithRate = new Set(rates.map((rate) => rate.member_user_id));
    return teamMembers.filter(
      (member) => member.user_id && !userIdsWithRate.has(member.user_id),
    );
  }, [rates, teamMembers]);

  const editingRateTarget = useMemo(
    () => rates.find((rate) => rate.id === editingRateId) ?? null,
    [rates, editingRateId],
  );

  const formatMemberRole = (member: ProjectMember) => {
    const role = member.role ? member.role.replace(/_/g, " ") : "member";
    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
    const position = (member.position || "").trim();
    return position ? `${roleLabel} | ${position}` : roleLabel;
  };

  const openEditRateModal = (rate: ProjectMemberTimeRate) => {
    setIsEditRateModalOpen(true);
    setEditingRateId(rate.id);
    setEditingRateCustomId(rate.custom_id || "");
    setEditingRateValue(String(rate.hourly_rate ?? ""));
    setEditingRateCurrency(rate.currency || "USD");
    setEditingRateStartDate(rate.start_date || "");
    setEditingRateEndDate(rate.end_date || "");
  };

  const closeEditRateModal = () => {
    setIsEditRateModalOpen(false);
    setIsDeleteRateModalOpen(false);
    setDeleteRateVerificationText("");
    setEditingRateId(null);
    setEditingRateCustomId("");
    setEditingRateValue("");
    setEditingRateCurrency("USD");
    setEditingRateStartDate("");
    setEditingRateEndDate("");
  };

  const createRate = async () => {
    if (!newRateMemberId) {
      setError("Select a member to add a time rate.");
      return;
    }

    const hourly = Number(newRateValue);
    if (!Number.isFinite(hourly) || hourly < 0) {
      setError("Hourly rate must be a non-negative number.");
      return;
    }
    if (!newRateStartDate) {
      setError("Start date is required.");
      return;
    }

    try {
      setError(null);
      await createRateMutation.mutateAsync({
        project_member_id: newRateMemberId,
        hourly_rate: hourly,
        currency: newRateCurrency.trim().toUpperCase() || "USD",
        custom_id: newRateCustomId.trim(),
        start_date: newRateStartDate,
        ...(newRateEndDate ? { end_date: newRateEndDate } : {}),
      });
      setIsAddRateModalOpen(false);
      setNewRateMemberId("");
      setNewRateCustomId("");
      setNewRateValue("");
      setNewRateCurrency("USD");
      setNewRateStartDate("");
      setNewRateEndDate("");
    } catch (e) {
      setError(getErrorMessage(e, "Failed to create rate."));
    }
  };

  const saveEditedRate = async (rateId: string) => {
    const hourly = Number(editingRateValue);
    if (!Number.isFinite(hourly) || hourly < 0) {
      setError("Hourly rate must be a non-negative number.");
      return;
    }
    if (!editingRateStartDate) {
      setError("Start date is required.");
      return;
    }

    try {
      setError(null);
      await updateRateMutation.mutateAsync({
        rateId,
        payload: {
          hourly_rate: hourly,
          currency: editingRateCurrency.trim().toUpperCase() || "USD",
          custom_id: editingRateCustomId.trim(),
          start_date: editingRateStartDate,
          ...(editingRateEndDate ? { end_date: editingRateEndDate } : {}),
        },
      });
      closeEditRateModal();
    } catch (e) {
      setError(getErrorMessage(e, "Failed to update rate."));
    }
  };

  const deleteEditedRate = async (rateId: string) => {
    if (deleteRateVerificationText.trim().toUpperCase() !== "DELETE") return;
    try {
      setError(null);
      await deleteRateMutation.mutateAsync(rateId);
      closeEditRateModal();
    } catch (e) {
      setError(getErrorMessage(e, "Failed to delete rate."));
    }
  };

  const onViewLogs = (rate: ProjectMemberTimeRate) => {
    if (actorUserId && rate.member_user_id === actorUserId) {
      void navigate({
        to: "/project/$projectId/time/my-logs",
        params: { projectId },
      });
      return;
    }

    if (!rate.project_member_id) {
      setError("Project member ID is missing for this rate.");
      return;
    }

    void navigate({
      to: "/project/$projectId/time/team-logs/$projectMemberId",
      params: { projectId, projectMemberId: rate.project_member_id },
    });
  };

  const savingRate = createRateMutation.isPending || updateRateMutation.isPending;
  const deletingRate = deleteRateMutation.isPending;

  return (
    <TimeRouteFrame
      projectId={projectId}
      activeTab="team_logs"
      loadingPermissions={loadingPermissions}
      showMyLogsTabSkeleton={showMyLogsTabSkeleton}
      canShowMyLogsTab={canShowMyLogsTab}
      canViewTeamLogs={canViewTeamLogs}
      errorMessage={error || queryErrorMessage}
    >
      {shouldShowAccessDenied ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-700 font-semibold">
            You do not have permission to access Time tracking.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Ask a manager to enable Time View permission.
          </p>
        </div>
      ) : !canViewTeamLogs ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-700 font-semibold">
            You do not have permission to access team logs.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Ask a manager for Team Logs or Approve permission.
          </p>
        </div>
      ) : (
        <>
          <TeamRatesSection
            rates={rates}
            loadingRates={loadingRates}
            canManageRates={canManageRates}
            onViewLogs={onViewLogs}
            onOpenAddRate={() => setIsAddRateModalOpen(true)}
            onOpenEditRate={openEditRateModal}
          />

          <AddRateModal
            isOpen={isAddRateModalOpen}
            canManageRates={canManageRates}
            membersWithoutRate={membersWithoutRate}
            loadingMembers={loadingMembers}
            savingRate={savingRate}
            newRateMemberId={newRateMemberId}
            newRateCustomId={newRateCustomId}
            newRateValue={newRateValue}
            newRateCurrency={newRateCurrency}
            newRateStartDate={newRateStartDate}
            newRateEndDate={newRateEndDate}
            onClose={() => setIsAddRateModalOpen(false)}
            onCreateRate={createRate}
            onChangeMemberId={setNewRateMemberId}
            onChangeCustomId={setNewRateCustomId}
            onChangeRateValue={setNewRateValue}
            onChangeRateCurrency={setNewRateCurrency}
            onChangeStartDate={setNewRateStartDate}
            onChangeEndDate={setNewRateEndDate}
            formatMemberRole={formatMemberRole}
          />

          <EditRateModal
            isOpen={isEditRateModalOpen}
            canManageRates={canManageRates}
            editingRateId={editingRateId}
            editingRateTarget={editingRateTarget}
            editingRateCustomId={editingRateCustomId}
            editingRateValue={editingRateValue}
            editingRateCurrency={editingRateCurrency}
            editingRateStartDate={editingRateStartDate}
            editingRateEndDate={editingRateEndDate}
            savingRate={savingRate}
            onClose={closeEditRateModal}
            onSave={saveEditedRate}
            onRequestDelete={() => setIsDeleteRateModalOpen(true)}
            onChangeCustomId={setEditingRateCustomId}
            onChangeRateValue={setEditingRateValue}
            onChangeRateCurrency={setEditingRateCurrency}
            onChangeStartDate={setEditingRateStartDate}
            onChangeEndDate={setEditingRateEndDate}
          />

          <DeleteRateModal
            isOpen={isDeleteRateModalOpen && Boolean(editingRateId)}
            targetLabel={
              editingRateTarget?.member?.display_name ||
              editingRateTarget?.member?.email ||
              editingRateTarget?.custom_id ||
              editingRateTarget?.member_user_id
            }
            verificationText={deleteRateVerificationText}
            deletingRate={deletingRate}
            onClose={() => {
              setIsDeleteRateModalOpen(false);
              setDeleteRateVerificationText("");
            }}
            onChangeVerificationText={setDeleteRateVerificationText}
            onConfirmDelete={() =>
              editingRateId ? deleteEditedRate(editingRateId) : undefined
            }
          />
        </>
      )}
    </TimeRouteFrame>
  );
}
