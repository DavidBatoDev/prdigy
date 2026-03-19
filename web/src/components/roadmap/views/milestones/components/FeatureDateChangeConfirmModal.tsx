import { X } from "lucide-react";
import { useId } from "react";
import type { FeatureDateDraftCommit } from "./MilestonesTimelineRows";

interface FeatureDateChangeConfirmModalProps {
	isOpen: boolean;
	isSaving: boolean;
	change: FeatureDateDraftCommit | null;
	dontAskAgain: boolean;
	onDontAskAgainChange: (value: boolean) => void;
	onCancel: () => void;
	onConfirm: () => Promise<void> | void;
}

export const FeatureDateChangeConfirmModal = ({
	isOpen,
	isSaving,
	change,
	dontAskAgain,
	onDontAskAgainChange,
	onCancel,
	onConfirm,
}: FeatureDateChangeConfirmModalProps) => {
	const inputId = useId();
	if (!isOpen || !change) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">
			<div className="w-full max-w-md overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-2xl">
				<div className="flex items-center justify-between border-b border-orange-100 bg-linear-to-r from-orange-50 to-amber-50 px-4 py-3">
					<h3 className="text-base font-semibold text-gray-900">
						Confirm Date Update
					</h3>
					<button
						type="button"
						onClick={onCancel}
						className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
						aria-label="Close date update modal"
					>
						<X size={16} />
					</button>
				</div>
				<div className="space-y-3 px-4 py-4 text-sm text-gray-700">
					<p>
						You are about to update date range for{" "}
						<span className="font-semibold">{change.feature.title}</span>.
					</p>
					<div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
						<div>
							<span className="font-medium text-gray-600">From:</span>{" "}
							{change.oldStartDate} - {change.oldEndDate}
						</div>
						<div className="mt-1">
							<span className="font-medium text-gray-600">To:</span>{" "}
							{change.newStartDate} - {change.newEndDate}
						</div>
					</div>
					<label
						htmlFor={inputId}
						className="flex cursor-pointer items-center gap-2 text-sm text-gray-700"
					>
						<input
							id={inputId}
							type="checkbox"
							checked={dontAskAgain}
							onChange={(event) => onDontAskAgainChange(event.target.checked)}
							className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
						/>
						<span>Don&apos;t ask again in this session</span>
					</label>
				</div>
				<div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
					<button
						type="button"
						onClick={onCancel}
						disabled={isSaving}
						className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-60"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={() => void onConfirm()}
						disabled={isSaving}
						className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
					>
						{isSaving ? "Saving..." : "Confirm"}
					</button>
				</div>
			</div>
		</div>
	);
};
