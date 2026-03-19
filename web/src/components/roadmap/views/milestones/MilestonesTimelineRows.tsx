import type { CSSProperties } from "react";
import type { RoadmapEpic } from "@/types/roadmap";
import { calculateFeatureProgressFromTasks } from "../../shared/featureProgress";
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
} from "./constants";
import type { Granularity } from "./types";
import {
	computeEpicRange,
	fmtEpicDateRange,
	fmtShort,
	getInclusiveDays,
	toTimelinePx,
} from "./utils";

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
}: MilestonesTimelineRowsProps) => {
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
									const epicLabel = `${epic.title} • ${fmtEpicDateRange(epicRange.start, epicRange.end)} • (${durationDays} day${durationDays > 1 ? "s" : ""})`;
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
								const taskProgress = calculateFeatureProgressFromTasks(
									feature.tasks,
								);
								const clampedProgress = Math.max(
									0,
									Math.min(100, taskProgress),
								);
								const barLeft = hasDates
									? toTimelinePx(
											new Date(feature.start_date ?? ""),
											rangeStart,
											granularity,
											cw,
										)
									: 0;
								const barRight = hasDates
									? toTimelinePx(
											new Date(feature.end_date ?? ""),
											rangeStart,
											granularity,
											cw,
										)
									: 0;
								const barWidth = Math.max(6, barRight - barLeft);
								const rawFillWidth = (barWidth * clampedProgress) / 100;
								const fillWidth =
									clampedProgress > 0 ? Math.max(3, rawFillWidth) : 0;
								const estimatedLabelWidth =
									feature.title.length * FEATURE_LABEL_CHAR_PX +
									FEATURE_LABEL_HORIZONTAL_PADDING;
								const labelFitsInside =
									barWidth >=
									Math.max(FEATURE_LABEL_MIN_INSIDE_WIDTH, estimatedLabelWidth);
								const tooltip = hasDates
									? `${fmtShort(feature.start_date ?? "")} → ${fmtShort(feature.end_date ?? "")} • ${clampedProgress}%`
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
													className={`absolute top-1/2 -translate-y-1/2 ${FEATURE_BAR_ROUNDED_CLASS} group cursor-default`}
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

													<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
														<div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-xl">
															<div className="font-semibold mb-0.5">
																{feature.title}
															</div>
															<div className="text-gray-300 text-[11px]">
																{tooltip}
															</div>
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
