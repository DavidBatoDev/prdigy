import type { CSSProperties } from "react";
import { DATE_HEADER_HEIGHT, SUB_ROW_H, SUPER_ROW_H } from "./constants";
import type { Granularity, MilestoneMarker, SuperGroup } from "./types";
import { fmtShort, subLabel } from "./utils";

interface MilestonesTimelineHeaderProps {
	totalWidth: number;
	rightHeaderTopHeight: number;
	cw: number;
	columns: Date[];
	superGroups: SuperGroup[] | null;
	todayColIndex: number;
	granularity: Granularity;
	gridBg: CSSProperties;
	milestoneMarkers: MilestoneMarker[];
	onMilestoneSelect: (marker: MilestoneMarker) => void;
}

const MilestoneLines = ({
	milestoneMarkers,
}: {
	milestoneMarkers: MilestoneMarker[];
}) => {
	return milestoneMarkers.map(({ milestone, left }) => (
		<div
			key={milestone.id}
			className="absolute top-0 bottom-0 -translate-x-1/2 group/milestone"
			style={{ left: Math.max(0, left) }}
		>
			<div
				className="absolute top-0 bottom-0 w-0.5"
				style={{
					backgroundImage: `repeating-linear-gradient(to bottom, ${milestone.color ?? "#f97316"} 0px, ${milestone.color ?? "#f97316"} 7px, transparent 7px, transparent 12px)`,
					opacity: 0.95,
				}}
			/>
		</div>
	));
};

export const MilestonesTimelineHeader = ({
	totalWidth,
	rightHeaderTopHeight,
	cw,
	columns,
	superGroups,
	todayColIndex,
	granularity,
	gridBg,
	milestoneMarkers,
	onMilestoneSelect,
}: MilestonesTimelineHeaderProps) => {
	let groupStartColumnIndex = 0;

	return (
		<>
			<div
				className="absolute left-0 right-0 bottom-0 z-20 pointer-events-none"
				style={{
					top: rightHeaderTopHeight + DATE_HEADER_HEIGHT - 1,
					width: totalWidth,
				}}
			>
				<MilestoneLines milestoneMarkers={milestoneMarkers} />
			</div>

			<div className="sticky top-0 z-30 bg-white border-b border-gray-200">
				{rightHeaderTopHeight > 0 && (
					<div
						className="relative border-b border-gray-100 bg-white"
						style={{ height: rightHeaderTopHeight, width: totalWidth }}
					>
						{milestoneMarkers.map((marker) => {
							const clampedLeft = Math.max(
								0,
								Math.min(totalWidth, marker.left),
							);
							return (
								<div
									key={`banner-${marker.milestone.id}`}
									className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
									style={{ left: clampedLeft }}
								>
									<button
										type="button"
										onClick={() => onMilestoneSelect(marker)}
										className="flex flex-col items-center gap-1 pointer-events-auto"
									>
										<span
											className="text-[11px] font-semibold whitespace-nowrap px-2 py-0.5 rounded bg-white/80"
											style={{ color: marker.milestone.color ?? "#f97316" }}
										>
											{marker.milestone.title}
										</span>
										<span
											className="h-3 w-3 rotate-45 rounded-[2px]"
											style={{
												backgroundColor: marker.milestone.color ?? "#f97316",
											}}
										/>
									</button>
								</div>
							);
						})}
					</div>
				)}

				<div
					className="absolute left-0 right-0 z-0 pointer-events-none"
					style={{ top: rightHeaderTopHeight, height: DATE_HEADER_HEIGHT }}
				>
					<MilestoneLines milestoneMarkers={milestoneMarkers} />
				</div>

				<div
					className="flex"
					style={{ height: SUPER_ROW_H, width: totalWidth }}
				>
					{superGroups
						? superGroups.map((group) => {
								const groupStartColumn =
									columns[groupStartColumnIndex]?.getTime() ??
									groupStartColumnIndex;
								groupStartColumnIndex += group.colCount;
								return (
									<div
										key={`${group.label}-${groupStartColumn}`}
										className="shrink-0 flex items-center justify-center border-r border-gray-200 overflow-hidden"
										style={{ width: group.colCount * cw }}
									>
										<span className="text-[11px] font-semibold text-blue-500 truncate">
											{group.label}
										</span>
									</div>
								);
							})
						: null}
				</div>

				<div
					className="flex border-t border-gray-100"
					style={{ height: SUB_ROW_H, width: totalWidth, ...gridBg }}
				>
					{columns.map((column, index) => (
						<div
							key={column.getTime()}
							className="shrink-0 flex items-center justify-center select-none"
							style={{
								width: cw,
								backgroundColor:
									index === todayColIndex ? "#fff7ed" : undefined,
							}}
							title={fmtShort(column.toISOString())}
						>
							<span
								className={`text-[11px] font-medium ${
									index === todayColIndex
										? "text-orange-500 font-semibold"
										: "text-gray-500"
								}`}
							>
								{subLabel(column, granularity)}
							</span>
						</div>
					))}
				</div>
			</div>
		</>
	);
};
