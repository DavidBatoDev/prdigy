import { Save, Trash2, X, XCircle } from "lucide-react";
import type {
  ProjectMemberTimeRate,
  ProjectTaskOption,
} from "@/services/project-time.service";
import type { ProjectMember } from "@/services/project.service";
import { TaskTreePicker } from "./TaskTreePicker";

interface EditLogModalProps {
  isOpen: boolean;
  startedAt: string;
  endedAt: string;
  saving: boolean;
  onClose: () => void;
  onSave: () => void | Promise<void>;
  onChangeStartedAt: (value: string) => void;
  onChangeEndedAt: (value: string) => void;
}

export function EditLogModal({
  isOpen,
  startedAt,
  endedAt,
  saving,
  onClose,
  onSave,
  onChangeStartedAt,
  onChangeEndedAt,
}: EditLogModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[165] flex items-center justify-center bg-slate-900/55 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Edit Log</h3>
            <p className="text-xs text-gray-500 mt-1">Update time-in and time-out.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Time-in
            </label>
            <input
              type="datetime-local"
              value={startedAt}
              onChange={(e) => onChangeStartedAt(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Time-Out
            </label>
            <input
              type="datetime-local"
              value={endedAt}
              onChange={(e) => onChangeEndedAt(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-4 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

interface AddRateModalProps {
  isOpen: boolean;
  canManageRates: boolean;
  membersWithoutRate: ProjectMember[];
  loadingMembers: boolean;
  savingRate: boolean;
  newRateMemberId: string;
  newRateCustomId: string;
  newRateValue: string;
  newRateCurrency: string;
  newRateStartDate: string;
  newRateEndDate: string;
  onClose: () => void;
  onCreateRate: () => void | Promise<void>;
  onChangeMemberId: (value: string) => void;
  onChangeCustomId: (value: string) => void;
  onChangeRateValue: (value: string) => void;
  onChangeRateCurrency: (value: string) => void;
  onChangeStartDate: (value: string) => void;
  onChangeEndDate: (value: string) => void;
  formatMemberRole: (member: ProjectMember) => string;
}

export function AddRateModal({
  isOpen,
  canManageRates,
  membersWithoutRate,
  loadingMembers,
  savingRate,
  newRateMemberId,
  newRateCustomId,
  newRateValue,
  newRateCurrency,
  newRateStartDate,
  newRateEndDate,
  onClose,
  onCreateRate,
  onChangeMemberId,
  onChangeCustomId,
  onChangeRateValue,
  onChangeRateCurrency,
  onChangeStartDate,
  onChangeEndDate,
  formatMemberRole,
}: AddRateModalProps) {
  if (!isOpen || !canManageRates) return null;

  return (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/55 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl border border-orange-100 bg-white shadow-[0_24px_80px_rgba(2,6,23,0.35)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-orange-100 px-6 py-5 bg-gradient-to-r from-orange-50 to-amber-50">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Add Team Rate</h3>
            <p className="text-xs text-slate-500 mt-1">
              Enable time tracking for a project member by assigning hourly rate.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-white/70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Select Member
            </label>
            <select
              value={newRateMemberId}
              onChange={(e) => onChangeMemberId(e.target.value)}
              disabled={savingRate || loadingMembers}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
            >
              <option value="">Select member</option>
              {membersWithoutRate.map((member) => {
                const memberName =
                  member.user?.display_name ||
                  member.user?.email ||
                  member.user_id ||
                  member.id;
                return (
                  <option key={member.id} value={member.id}>
                    {memberName} ({formatMemberRole(member)})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Custom ID
              </label>
              <input
                type="text"
                value={newRateCustomId}
                onChange={(e) => onChangeCustomId(e.target.value)}
                placeholder="Employee/Freelancer ID"
                disabled={savingRate}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Hourly Rate
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={newRateValue}
                onChange={(e) => onChangeRateValue(e.target.value)}
                placeholder="e.g. 25.00"
                disabled={savingRate}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Currency
              </label>
              <input
                type="text"
                value={newRateCurrency}
                onChange={(e) => onChangeRateCurrency(e.target.value)}
                placeholder="USD"
                maxLength={8}
                disabled={savingRate}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Start Date
              </label>
              <input
                type="date"
                value={newRateStartDate}
                onChange={(e) => onChangeStartDate(e.target.value)}
                disabled={savingRate}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={newRateEndDate}
                onChange={(e) => onChangeEndDate(e.target.value)}
                disabled={savingRate}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
          </div>

          <div className="rounded-xl border border-orange-100 bg-orange-50/60 px-3 py-2 text-xs text-slate-600">
            Members with no rate row cannot use the Time page or timer actions.
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-orange-100 px-6 py-4 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            disabled={savingRate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onCreateRate()}
            disabled={savingRate || loadingMembers}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md border border-orange-300 bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            Save Rate
          </button>
        </div>
      </div>
    </div>
  );
}

interface EditRateModalProps {
  isOpen: boolean;
  canManageRates: boolean;
  editingRateId: string | null;
  editingRateTarget: ProjectMemberTimeRate | null;
  editingRateCustomId: string;
  editingRateValue: string;
  editingRateCurrency: string;
  editingRateStartDate: string;
  editingRateEndDate: string;
  savingRate: boolean;
  onClose: () => void;
  onSave: (rateId: string) => void | Promise<void>;
  onRequestDelete: () => void;
  onChangeCustomId: (value: string) => void;
  onChangeRateValue: (value: string) => void;
  onChangeRateCurrency: (value: string) => void;
  onChangeStartDate: (value: string) => void;
  onChangeEndDate: (value: string) => void;
}

export function EditRateModal({
  isOpen,
  canManageRates,
  editingRateId,
  editingRateTarget,
  editingRateCustomId,
  editingRateValue,
  editingRateCurrency,
  editingRateStartDate,
  editingRateEndDate,
  savingRate,
  onClose,
  onSave,
  onRequestDelete,
  onChangeCustomId,
  onChangeRateValue,
  onChangeRateCurrency,
  onChangeStartDate,
  onChangeEndDate,
}: EditRateModalProps) {
  if (!isOpen || !canManageRates || !editingRateId) return null;

  const memberName =
    editingRateTarget?.member?.display_name ||
    editingRateTarget?.member?.email ||
    editingRateTarget?.member_user_id ||
    "Unknown member";

  return (
    <div
      className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-900/55 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl border border-orange-100 bg-white shadow-[0_24px_80px_rgba(2,6,23,0.35)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-orange-100 px-6 py-5 bg-gradient-to-r from-orange-50 to-amber-50">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Edit Team Rate</h3>
            <p className="text-xs text-slate-500 mt-1">{memberName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-white/70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Custom ID
              </label>
              <input
                type="text"
                value={editingRateCustomId}
                onChange={(e) => onChangeCustomId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Hourly Rate
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={editingRateValue}
                onChange={(e) => onChangeRateValue(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Currency
              </label>
              <input
                type="text"
                maxLength={8}
                value={editingRateCurrency}
                onChange={(e) => onChangeRateCurrency(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Start Date
              </label>
              <input
                type="date"
                value={editingRateStartDate}
                onChange={(e) => onChangeStartDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={editingRateEndDate}
                onChange={(e) => onChangeEndDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-orange-100 px-6 py-4 bg-slate-50">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onRequestDelete}
              disabled={savingRate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Rate
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={savingRate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void onSave(editingRateId)}
                disabled={savingRate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md border border-orange-300 bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DeleteRateModalProps {
  isOpen: boolean;
  targetLabel?: string;
  verificationText: string;
  deletingRate: boolean;
  onClose: () => void;
  onChangeVerificationText: (value: string) => void;
  onConfirmDelete: () => void | Promise<void>;
}

export function DeleteRateModal({
  isOpen,
  targetLabel,
  verificationText,
  deletingRate,
  onClose,
  onChangeVerificationText,
  onConfirmDelete,
}: DeleteRateModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-900/55 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-red-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-red-100 px-5 py-4 bg-red-50">
          <div>
            <h3 className="text-base font-semibold text-red-800">Delete Team Rate</h3>
            <p className="text-xs text-red-700 mt-1">
              This action cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-red-700 hover:bg-red-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {targetLabel && (
            <p className="text-xs text-gray-600">
              You are deleting rate for <span className="font-semibold">{targetLabel}</span>.
            </p>
          )}
          <p className="text-xs text-gray-600">
            Type <span className="font-bold">DELETE</span> to confirm.
          </p>
          <input
            type="text"
            value={verificationText}
            onChange={(e) => onChangeVerificationText(e.target.value)}
            placeholder="Type DELETE"
            className="w-full px-3 py-2 text-sm border border-red-200 rounded-md bg-white"
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-red-100 px-5 py-4 bg-red-50/40">
          <button
            type="button"
            onClick={onClose}
            disabled={deletingRate}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onConfirmDelete()}
            disabled={deletingRate || verificationText.trim().toUpperCase() !== "DELETE"}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-red-300 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
}

interface AddLogModalProps {
  isOpen: boolean;
  tasks: ProjectTaskOption[];
  selectedTaskId: string;
  saving: boolean;
  onClose: () => void;
  onSave: () => void | Promise<void>;
  onChangeTaskId: (value: string) => void;
}

export function AddLogModal({
  isOpen,
  tasks,
  selectedTaskId,
  saving,
  onClose,
  onSave,
  onChangeTaskId,
}: AddLogModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[168] flex items-center justify-center bg-slate-900/55 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Add Time Log</h3>
            <p className="text-xs text-gray-500 mt-1">Choose a task to start logging time.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Task
          </label>
          <div className="mt-1.5">
            <TaskTreePicker
              tasks={tasks}
              value={selectedTaskId}
              onChange={onChangeTaskId}
              disabled={saving}
              placeholder="Select a task"
              triggerClassName="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-left"
              panelClassName="max-h-80 overflow-auto rounded-md border border-gray-200 bg-white p-1 shadow-lg"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-4 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={saving || !selectedTaskId}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-orange-300 bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            Add Log
          </button>
        </div>
      </div>
    </div>
  );
}
