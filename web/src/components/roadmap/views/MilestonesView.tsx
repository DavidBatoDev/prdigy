import { BarChart2, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
	Roadmap,
	RoadmapEpic,
	RoadmapFeature,
	RoadmapMilestone,
} from "@/types/roadmap";
import {
	type ExplorerSearchResult,
	getSortedEpics,
	ROADMAP_STRUCTURE_EXPLORER_CONFIG,
} from "../panels/explorer/RoadmapStructureHeader";
import {
	DATE_HEADER_HEIGHT,
	DEFAULT_EXPLORER_HEADER_HEIGHT,
	FeatureDateChangeConfirmModal,
	type FeatureDateDraftCommit,
	type Granularity,
	MilestoneEditorModal,
	MilestonesLeftPanel,
	MilestonesTimelineHeader,
	MilestonesTimelineRows,
	MilestonesToolbar,
	RIGHT_HEADER_HEIGHT,
	useMilestoneEditor,
	useMilestonesPan,
	useMilestonesTimeline,
} from "./milestones";

export interface MilestonesViewProps {
	roadmap: Roadmap;
	milestones: RoadmapMilestone[];
	epics: RoadmapEpic[];
	onAddMilestone: (data: {
		title: string;
		target_date: string;
		description?: string;
		status?: RoadmapMilestone["status"];
		color?: string;
	}) => Promise<void> | void;
	onUpdateMilestone: (milestone: RoadmapMilestone) => Promise<void> | void;
	onDeleteMilestone: (id: string) => Promise<void> | void;
	onUpdateFeature: (feature: RoadmapFeature) => Promise<void> | void;
	canEditTimelineDates?: boolean;
	onNavigateToEpic?: (epicId: string) => void;
}

const FEATURE_DATE_CONFIRM_SKIP_KEY = "roadmap.timeline.skipDragDateConfirm";

export const MilestonesView = ({
	roadmap: _roadmap,
	milestones,
	epics,
	onAddMilestone,
	onUpdateMilestone,
	onDeleteMilestone: _onDeleteMilestone,
	onUpdateFeature,
	canEditTimelineDates = true,
	onNavigateToEpic,
}: MilestonesViewProps) => {
	const [granularity, setGranularity] = useState<Granularity>("month");
	const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
	const [leftHeaderHeight, setLeftHeaderHeight] = useState(
		DEFAULT_EXPLORER_HEADER_HEIGHT,
	);
	const [pendingFeatureDateChange, setPendingFeatureDateChange] =
		useState<FeatureDateDraftCommit | null>(null);
	const [isConfirmingFeatureDateChange, setIsConfirmingFeatureDateChange] =
		useState(false);
	const [dontAskAgainInSession, setDontAskAgainInSession] = useState(false);
	const verticalScrollRef = useRef<HTMLDivElement>(null);
	const timelineScrollRef = useRef<HTMLDivElement>(null);
	const leftHeaderRef = useRef<HTMLDivElement>(null);
	const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
	const timelineExplorerConfig = ROADMAP_STRUCTURE_EXPLORER_CONFIG.timeline;

	const sortedMilestones = useMemo(
		() => [...milestones].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
		[milestones],
	);
	const sortedEpics = useMemo(() => getSortedEpics(epics), [epics]);

	const toggleEpic = useCallback((id: string) => {
		setCollapsed((state) => {
			const next = new Set(state);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	}, []);

	const collapsableEpicIds = useMemo(
		() =>
			sortedEpics
				.filter((epic) => (epic.features?.length ?? 0) > 0)
				.map((epic) => epic.id),
		[sortedEpics],
	);
	const hasAnyExpanded = useMemo(
		() => collapsableEpicIds.some((id) => !collapsed.has(id)),
		[collapsableEpicIds, collapsed],
	);

	const stickyHeaderHeight = Math.max(leftHeaderHeight, RIGHT_HEADER_HEIGHT);
	const rightHeaderTopHeight = Math.max(
		0,
		leftHeaderHeight - DATE_HEADER_HEIGHT,
	);

	const getEpicRowKey = useCallback((epicId: string) => `epic:${epicId}`, []);
	const getFeatureRowKey = useCallback(
		(featureId: string) => `feature:${featureId}`,
		[],
	);

	const setRowRef = useCallback((key: string, node: HTMLDivElement | null) => {
		if (node) {
			rowRefs.current.set(key, node);
			return;
		}
		rowRefs.current.delete(key);
	}, []);

	const setEpicRowRef = useCallback(
		(epicId: string) => (node: HTMLDivElement | null) => {
			setRowRef(getEpicRowKey(epicId), node);
		},
		[setRowRef, getEpicRowKey],
	);
	const setFeatureRowRef = useCallback(
		(featureId: string) => (node: HTMLDivElement | null) => {
			setRowRef(getFeatureRowKey(featureId), node);
		},
		[setRowRef, getFeatureRowKey],
	);

	const scrollToRow = useCallback(
		(rowKey: string) => {
			const scrollContainer = verticalScrollRef.current;
			const rowNode = rowRefs.current.get(rowKey);
			if (!scrollContainer || !rowNode) return;

			const targetTop = Math.max(0, rowNode.offsetTop - stickyHeaderHeight - 8);
			scrollContainer.scrollTo({ top: targetTop, behavior: "smooth" });
		},
		[stickyHeaderHeight],
	);

	const scrollToRowAfterLayout = useCallback(
		(rowKey: string) => {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					scrollToRow(rowKey);
				});
			});
		},
		[scrollToRow],
	);

	const handleToggleCollapseAll = useCallback(() => {
		if (hasAnyExpanded) {
			setCollapsed(new Set(collapsableEpicIds));
			return;
		}
		setCollapsed(new Set());
	}, [hasAnyExpanded, collapsableEpicIds]);

	const handleTimelineSearchResultSelect = useCallback(
		(result: ExplorerSearchResult) => {
			if (result.type === "epic") {
				setCollapsed((prev) => {
					if (!prev.has(result.id)) return prev;
					const next = new Set(prev);
					next.delete(result.id);
					return next;
				});
				scrollToRowAfterLayout(getEpicRowKey(result.id));
				return;
			}

			const targetEpicId = result.epicId;
			const targetFeatureId =
				result.type === "feature" ? result.id : (result.featureId ?? null);

			if (targetEpicId) {
				setCollapsed((prev) => {
					if (!prev.has(targetEpicId)) return prev;
					const next = new Set(prev);
					next.delete(targetEpicId);
					return next;
				});
			}

			if (targetFeatureId) {
				scrollToRowAfterLayout(getFeatureRowKey(targetFeatureId));
				return;
			}

			if (targetEpicId) {
				scrollToRowAfterLayout(getEpicRowKey(targetEpicId));
			}
		},
		[scrollToRowAfterLayout, getEpicRowKey, getFeatureRowKey],
	);

	const {
		rangeStart,
		columns,
		superGroups,
		cw,
		totalWidth,
		todayPx,
		todayColIndex,
		todayColLeft,
		todayColInRange,
		hasAnyDates,
		milestoneMarkers,
		gridBg,
	} = useMilestonesTimeline({
		sortedEpics,
		sortedMilestones,
		granularity,
	});

	const {
		milestoneModalMode,
		isMilestoneModalOpen,
		isSavingMilestone,
		draftTitle,
		draftDate,
		draftStatus,
		draftColor,
		setDraftTitle,
		setDraftDate,
		setDraftStatus,
		setDraftColor,
		startCreateMilestone,
		startEditMilestone,
		cancelMilestoneEditor,
		submitMilestone,
	} = useMilestoneEditor({
		sortedMilestones,
		onAddMilestone,
		onUpdateMilestone,
	});

	const { isPanningTimeline } = useMilestonesPan({
		timelineScrollRef,
		verticalScrollRef,
	});

	useEffect(() => {
		const node = leftHeaderRef.current;
		if (!node) return;

		const updateHeight = () => {
			const nextHeight = Math.max(
				RIGHT_HEADER_HEIGHT,
				Math.ceil(node.getBoundingClientRect().height),
			);
			setLeftHeaderHeight(nextHeight);
		};

		updateHeight();
		if (typeof ResizeObserver === "undefined") {
			return;
		}

		const observer = new ResizeObserver(() => updateHeight());
		observer.observe(node);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		let raf: number;
		const run = () => {
			const timelineElement = timelineScrollRef.current;
			if (!timelineElement) return;
			const visibleWidth = timelineElement.clientWidth;
			const target = todayPx - visibleWidth / 2;
			timelineElement.scrollLeft = Math.max(0, target);
		};
		raf = requestAnimationFrame(run);
		return () => cancelAnimationFrame(raf);
	}, [todayPx]);

	const applyFeatureDateChange = useCallback(
		async (change: FeatureDateDraftCommit) => {
			setIsConfirmingFeatureDateChange(true);
			try {
				await onUpdateFeature({
					...change.feature,
					start_date: change.newStartDate,
					end_date: change.newEndDate,
					updated_at: new Date().toISOString(),
				});
				setPendingFeatureDateChange(null);
			} finally {
				setIsConfirmingFeatureDateChange(false);
			}
		},
		[onUpdateFeature],
	);

	const handleFeatureDateDraftCommit = useCallback(
		(change: FeatureDateDraftCommit) => {
			if (!canEditTimelineDates) return;
			const shouldSkipConfirm =
				typeof window !== "undefined" &&
				window.sessionStorage.getItem(FEATURE_DATE_CONFIRM_SKIP_KEY) === "1";
			if (shouldSkipConfirm) {
				void applyFeatureDateChange(change);
				return;
			}

			setDontAskAgainInSession(false);
			setPendingFeatureDateChange(change);
		},
		[applyFeatureDateChange, canEditTimelineDates],
	);

	const handleConfirmFeatureDateChange = useCallback(async () => {
		if (!pendingFeatureDateChange) return;
		if (dontAskAgainInSession && typeof window !== "undefined") {
			window.sessionStorage.setItem(FEATURE_DATE_CONFIRM_SKIP_KEY, "1");
		}
		await applyFeatureDateChange(pendingFeatureDateChange);
	}, [applyFeatureDateChange, dontAskAgainInSession, pendingFeatureDateChange]);

	const handleCancelFeatureDateChange = useCallback(() => {
		setPendingFeatureDateChange(null);
		setDontAskAgainInSession(false);
	}, []);

	return (
		<div className="absolute inset-0 bg-white">
			<MilestonesToolbar
				granularity={granularity}
				onGranularityChange={setGranularity}
			/>

			<div
				ref={verticalScrollRef}
				className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-white hide-scrollbar"
			>
				<div className="flex min-w-0">
					<MilestonesLeftPanel
						leftHeaderRef={leftHeaderRef}
						sortedEpics={sortedEpics}
						collapsed={collapsed}
						hasAnyDates={hasAnyDates}
						hasAnyExpanded={hasAnyExpanded}
						showCollapseToggle={
							timelineExplorerConfig.allowFeatureCollapse === false
						}
						onToggleEpic={toggleEpic}
						onToggleCollapseAll={handleToggleCollapseAll}
						onSearchResultSelect={handleTimelineSearchResultSelect}
						setEpicRowRef={setEpicRowRef}
						setFeatureRowRef={setFeatureRowRef}
						onNavigateToEpic={onNavigateToEpic}
					/>

					<div
						ref={timelineScrollRef}
						className={`min-w-0 flex-1 overflow-x-auto overflow-y-visible hide-scrollbar ${
							isPanningTimeline ? "cursor-grabbing select-none" : "cursor-grab"
						}`}
					>
						<div className="relative" style={{ width: totalWidth }}>
							<MilestonesTimelineHeader
								totalWidth={totalWidth}
								rightHeaderTopHeight={rightHeaderTopHeight}
								cw={cw}
								columns={columns}
								superGroups={superGroups}
								todayColIndex={todayColIndex}
								granularity={granularity}
								gridBg={gridBg}
								milestoneMarkers={milestoneMarkers}
								onMilestoneSelect={(marker) =>
									startEditMilestone(marker.milestone)
								}
							/>

							{!hasAnyDates && (
								<div className="flex items-center justify-center py-24 text-center">
									<div>
										<BarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
										<p className="text-gray-600 font-medium text-base">
											No dates set yet
										</p>
										<p className="text-gray-400 text-sm mt-1 max-w-xs">
											Add start and end dates to features to see them on the
											timeline
										</p>
									</div>
								</div>
							)}

							<MilestonesTimelineRows
								sortedEpics={sortedEpics}
								collapsed={collapsed}
								totalWidth={totalWidth}
								gridBg={gridBg}
								todayColInRange={todayColInRange}
								todayColLeft={todayColLeft}
								cw={cw}
								rangeStart={rangeStart}
								granularity={granularity}
								canEditDateRanges={canEditTimelineDates}
								onFeatureDateDraftCommit={handleFeatureDateDraftCommit}
							/>
						</div>
					</div>
				</div>

				<button
					type="button"
					onClick={startCreateMilestone}
					className="fixed bottom-6 left-1/2 z-40 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-base font-semibold text-white shadow-lg transition-colors hover:bg-orange-600"
				>
					<Plus size={18} />
					Add Milestone
				</button>

				<MilestoneEditorModal
					isOpen={isMilestoneModalOpen}
					mode={milestoneModalMode}
					isSaving={isSavingMilestone}
					draftTitle={draftTitle}
					draftDate={draftDate}
					draftStatus={draftStatus}
					draftColor={draftColor}
					onDraftTitleChange={setDraftTitle}
					onDraftDateChange={setDraftDate}
					onDraftStatusChange={setDraftStatus}
					onDraftColorChange={setDraftColor}
					onCancel={cancelMilestoneEditor}
					onSubmit={submitMilestone}
				/>

				<FeatureDateChangeConfirmModal
					isOpen={pendingFeatureDateChange !== null}
					change={pendingFeatureDateChange}
					isSaving={isConfirmingFeatureDateChange}
					dontAskAgain={dontAskAgainInSession}
					onDontAskAgainChange={setDontAskAgainInSession}
					onCancel={handleCancelFeatureDateChange}
					onConfirm={handleConfirmFeatureDateChange}
				/>
			</div>
		</div>
	);
};
