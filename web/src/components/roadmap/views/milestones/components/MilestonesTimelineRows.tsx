import {
	useCallback,
	useEffect,
	useState,
	type CSSProperties,
	type MouseEvent as ReactMouseEvent,
} from "react";
import type { RoadmapEpic, RoadmapFeature } from "@/types/roadmap";
import { calculateFeatureProgressFromTasks } from "../../../shared/featureProgress";
import {
	EPIC_LINE_HEIGHT,
	EPIC_LINE_OPACITY,
	FEATURE_BAR_BORDER_COLOR,
	FEATURE_BAR_FILL_COLOR,
	FEATURE_BAR_HEIGHT,
	FEATURE_BAR_ROUNDED_CLASS,
	FEATURE_BAR_TRACK_COLOR,
	FEATURE_LABEL_CHAR_PX,
	FEATURE_LABEL_HORIZONTAL_PADDING,
	FEATURE_LABEL_MIN_INSIDE_WIDTH,
	FEATURE_LABEL_OUTSIDE_GAP,
	FIRST_EPIC_EXTRA_HEIGHT,
	ROW_HEIGHT,
} from "../model/constants";
import type { Granularity } from "../model/types";
import {
	addDays,
	clampDate,
	computeEpicRange,
	dateFromTimelinePx,
	daysBetween,
	fmtEpicDateRange,
	fmtShort,
	floorToUnit,
	getInclusiveDays,
	toISODateString,
	toTimelinePx,
} from "../model/utils";

type FeatureDragMode = "start" | "end" | "move";

export type FeatureDateDraftCommit = {
	feature: RoadmapFeature;
	oldStartDate: string;
	oldEndDate: string;
	newStartDate: string;
	newEndDate: string;
};

export type FeatureDateVisualDraft = {
	startDate: string;
	endDate: string;
};

interface MilestonesTimelineRowsProps {
	sortedEpics: RoadmapEpic[];
	collapsed: Set<string>;
	totalWidth: number;
	gridBg: CSSProperties;
	todayColInRange: boolean;
	todayColLeft: number;
	cw: number;
	rangeStart: Date;
	granularity: Granularity;
	canEditDateRanges?: boolean;
	featureDateVisualDrafts?: Record<string, FeatureDateVisualDraft>;
	onFeatureDateDraftCommit?: (change: FeatureDateDraftCommit) => void;
}

export const MilestonesTimelineRows = ({
	sortedEpics,
	collapsed,
	totalWidth,
	gridBg,
	todayColInRange,
	todayColLeft,
	cw,
	rangeStart,
	granularity,
	canEditDateRanges = true,
	featureDateVisualDrafts = {},
	onFeatureDateDraftCommit,
}: MilestonesTimelineRowsProps) => {
	const [dragState, setDragState] = useState<{
		feature: RoadmapFeature;
		mode: FeatureDragMode;
		anchorClientX: number;
		initialStartDate: Date;
		initialEndDate: Date;
		draftStartDate: Date;
		draftEndDate: Date;
	} | null>(null);

	const handleDragStart = useCallback(
		(
			event: ReactMouseEvent<HTMLDivElement>,
			feature: RoadmapFeature,
			mode: FeatureDragMode,
			effectiveStartDate?: Date | null,
			effectiveEndDate?: Date | null,
		) => {
			if (!canEditDateRanges) return;
			const startDate = effectiveStartDate
				? floorToUnit(effectiveStartDate, "day")
				: feature.start_date
					? floorToUnit(new Date(feature.start_date), "day")
					: null;
			const endDate = effectiveEndDate
				? floorToUnit(effectiveEndDate, "day")
				: feature.end_date
					? floorToUnit(new Date(feature.end_date), "day")
					: null;
			if (!startDate || !endDate) return;
			event.preventDefault();
			event.stopPropagation();

			setDragState({
				feature,
				mode,
				anchorClientX: event.clientX,
				initialStartDate: startDate,
				initialEndDate: endDate,
				draftStartDate: startDate,
				draftEndDate: endDate,
			});
		},
		[canEditDateRanges],
	);

	useEffect(() => {
		if (!dragState) return;

		const handleMouseMove = (event: MouseEvent) => {
			const dx = event.clientX - dragState.anchorClientX;
			const initialStartPx = toTimelinePx(
				dragState.initialStartDate,
				rangeStart,
				granularity,
				cw,
			);
			const initialEndPx = toTimelinePx(
				dragState.initialEndDate,
				rangeStart,
				granularity,
				cw,
			);

			if (dragState.mode === "move") {
				const shiftedStartDate = dateFromTimelinePx(
					initialStartPx + dx,
					rangeStart,
					granularity,
					cw,
				);
				const deltaDays = Math.round(
					daysBetween(dragState.initialStartDate, shiftedStartDate),
				);
				setDragState((prev) =>
					prev
						? {
								...prev,
								draftStartDate: addDays(prev.initialStartDate, deltaDays),
								draftEndDate: addDays(prev.initialEndDate, deltaDays),
							}
						: prev,
				);
				return;
			}

			if (dragState.mode === "start") {
				const rawStartDate = dateFromTimelinePx(
					initialStartPx + dx,
					rangeStart,
					granularity,
					cw,
				);
				const nextStartDate = clampDate(
					rawStartDate,
					undefined,
					dragState.initialEndDate,
				);
				setDragState((prev) =>
					prev
						? {
								...prev,
								draftStartDate: nextStartDate,
								draftEndDate: prev.initialEndDate,
							}
						: prev,
				);
				return;
			}

			const rawEndDate = dateFromTimelinePx(
				initialEndPx + dx,
				rangeStart,
				granularity,
				cw,
			);
			const nextEndDate = clampDate(
				rawEndDate,
				dragState.initialStartDate,
				undefined,
			);
			setDragState((prev) =>
				prev
					? {
							...prev,
							draftStartDate: prev.initialStartDate,
							draftEndDate: nextEndDate,
						}
					: prev,
			);
		};

		const handleMouseUp = () => {
			const oldStartDate = toISODateString(dragState.initialStartDate);
			const oldEndDate = toISODateString(dragState.initialEndDate);
			const newStartDate = toISODateString(dragState.draftStartDate);
			const newEndDate = toISODateString(dragState.draftEndDate);

			if (
				(oldStartDate !== newStartDate || oldEndDate !== newEndDate) &&
				onFeatureDateDraftCommit
			) {
				onFeatureDateDraftCommit({
					feature: dragState.feature,
					oldStartDate,
					oldEndDate,
					newStartDate,
					newEndDate,
				});
			}

			setDragState(null);
		};

		document.body.style.userSelect = "none";
		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);
		return () => {
			document.body.style.userSelect = "";
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [dragState, rangeStart, granularity, cw, onFeatureDateDraftCommit]);

	return (
		<>
			{sortedEpics.map((epic, epicIndex) => {
				const isCollapsed = collapsed.has(epic.id);
				const epicColor = epic.color ?? "#6366f1";
				const epicRange = computeEpicRange(epic);
				const features = epic.features ?? [];
				const epicRowHeight =
					ROW_HEIGHT + (epicIndex === 0 ? FIRST_EPIC_EXTRA_HEIGHT : 0);

				return (
					<div key={`right-${epic.id}`}>
						<div
							className="relative border-b border-gray-200"
							style={{
								height: epicRowHeight,
								width: totalWidth,
								...gridBg,
							}}
						>
							{todayColInRange && (
								<div
									className="absolute top-0 bottom-0 pointer-events-none"
									style={{
										left: todayColLeft,
										width: cw,
										backgroundColor: "#f97316",
										opacity: 0.07,
									}}
								/>
							)}
							{epicRange &&
								(() => {
									const left = toTimelinePx(
										epicRange.start,
										rangeStart,
										granularity,
										cw,
									);
									const right = toTimelinePx(
										epicRange.end,
										rangeStart,
										granularity,
										cw,
									);
									const lineLeft = Math.max(0, left);
									const lineWidth = Math.max(6, right - left);
									const durationDays = getInclusiveDays(
										epicRange.start,
										epicRange.end,
									);
									const epicLabel = `${epic.title} | ${fmtEpicDateRange(epicRange.start, epicRange.end)} | (${durationDays} day${durationDays > 1 ? "s" : ""})`;
									return (
										<div
											className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
											style={{ left: lineLeft }}
										>
											<div className="text-[11px] text-gray-700 font-medium whitespace-nowrap truncate max-w-[420px]">
												{epicLabel}
											</div>
											<div
												className="mt-1 rounded-sm"
												style={{
													width: lineWidth,
													height: EPIC_LINE_HEIGHT,
													backgroundColor: epicColor,
													opacity: EPIC_LINE_OPACITY,
												}}
											/>
										</div>
									);
								})()}
						</div>

						{!isCollapsed &&
							features.map((feature) => {
								const hasDates = !!(feature.start_date && feature.end_date);
								const visualDraft = featureDateVisualDrafts[feature.id];
								const featureDragState =
									dragState?.feature.id === feature.id ? dragState : null;
								const effectiveStartDate = featureDragState
									? featureDragState.draftStartDate
									: visualDraft
										? floorToUnit(new Date(visualDraft.startDate), "day")
									: hasDates
										? floorToUnit(new Date(feature.start_date ?? ""), "day")
										: null;
								const effectiveEndDate = featureDragState
									? featureDragState.draftEndDate
									: visualDraft
										? floorToUnit(new Date(visualDraft.endDate), "day")
									: hasDates
										? floorToUnit(new Date(feature.end_date ?? ""), "day")
										: null;
								const taskProgress = calculateFeatureProgressFromTasks(
									feature.tasks,
								);
								const clampedProgress = Math.max(0, Math.min(100, taskProgress));
								const barLeft = effectiveStartDate
									? toTimelinePx(effectiveStartDate, rangeStart, granularity, cw)
									: 0;
								const barRight = effectiveEndDate
									? toTimelinePx(effectiveEndDate, rangeStart, granularity, cw)
									: 0;
								const barWidth = Math.max(6, barRight - barLeft);
								const rawFillWidth = (barWidth * clampedProgress) / 100;
								const fillWidth = clampedProgress > 0 ? Math.max(3, rawFillWidth) : 0;
								const estimatedLabelWidth =
									feature.title.length * FEATURE_LABEL_CHAR_PX +
									FEATURE_LABEL_HORIZONTAL_PADDING;
								const labelFitsInside =
									barWidth >=
									Math.max(FEATURE_LABEL_MIN_INSIDE_WIDTH, estimatedLabelWidth);
								const startTooltipDate = effectiveStartDate
									? toISODateString(effectiveStartDate)
									: feature.start_date ?? "";
								const endTooltipDate = effectiveEndDate
									? toISODateString(effectiveEndDate)
									: feature.end_date ?? "";
								const tooltip = hasDates
									? `${fmtShort(startTooltipDate)} -> ${fmtShort(endTooltipDate)} | ${clampedProgress}%`
									: "No dates set";

								return (
									<div
										key={`right-feature-${feature.id}`}
										className="relative border-b border-gray-100"
										style={{
											height: ROW_HEIGHT,
											width: totalWidth,
											...gridBg,
										}}
									>
										{todayColInRange && (
											<div
												className="absolute top-0 bottom-0 pointer-events-none"
												style={{
													left: todayColLeft,
													width: cw,
													backgroundColor: "#f97316",
													opacity: 0.07,
												}}
											/>
										)}
										{hasDates && (
											<>
												<div
													className={`absolute top-1/2 -translate-y-1/2 ${FEATURE_BAR_ROUNDED_CLASS} group ${canEditDateRanges ? "cursor-move" : "cursor-default"}`}
													data-no-pan="true"
													onMouseDown={(event) =>
														handleDragStart(
															event,
															feature,
															"move",
															effectiveStartDate,
															effectiveEndDate,
														)
													}
													style={{
														left: Math.max(0, barLeft),
														width: barWidth,
														height: FEATURE_BAR_HEIGHT,
														backgroundColor: FEATURE_BAR_TRACK_COLOR,
														borderColor: FEATURE_BAR_BORDER_COLOR,
														borderWidth: 1,
													}}
												>
													<div
														className={`absolute left-0 top-0 bottom-0 ${FEATURE_BAR_ROUNDED_CLASS}`}
														style={{
															width: fillWidth,
															backgroundColor: FEATURE_BAR_FILL_COLOR,
														}}
													/>

													{canEditDateRanges && (
														<>
															<div
																className="absolute left-0 top-0 bottom-0 z-20 w-2 cursor-ew-resize bg-black/0 hover:bg-black/10"
																data-no-pan="true"
																onMouseDown={(event) =>
																	handleDragStart(
																		event,
																		feature,
																		"start",
																		effectiveStartDate,
																		effectiveEndDate,
																	)
																}
															/>
															<div
																className="absolute right-0 top-0 bottom-0 z-20 w-2 cursor-ew-resize bg-black/0 hover:bg-black/10"
																data-no-pan="true"
																onMouseDown={(event) =>
																	handleDragStart(
																		event,
																		feature,
																		"end",
																		effectiveStartDate,
																		effectiveEndDate,
																	)
																}
															/>
														</>
													)}

													<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
														<div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-xl">
															<div className="font-semibold mb-0.5">
																{feature.title}
															</div>
															<div className="text-gray-300 text-[11px]">{tooltip}</div>
														</div>
													</div>

													{labelFitsInside && (
														<span className="absolute inset-0 flex items-center px-2 text-[10px] text-gray-800 font-medium truncate select-none">
															{feature.title}
														</span>
													)}
												</div>

												{!labelFitsInside && (
													<span
														className="absolute top-1/2 -translate-y-1/2 text-[11px] text-gray-700 font-medium whitespace-nowrap select-none pointer-events-none"
														style={{
															left:
																Math.max(0, barLeft) +
																barWidth +
																FEATURE_LABEL_OUTSIDE_GAP,
														}}
													>
														{feature.title}
													</span>
												)}
											</>
										)}
									</div>
								);
							})}
					</div>
				);
			})}
		</>
	);
};
