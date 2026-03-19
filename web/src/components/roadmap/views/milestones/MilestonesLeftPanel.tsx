import {
	BarChart2,
	ChevronDown,
	ChevronRight,
	ExternalLink,
} from "lucide-react";
import type { RefObject } from "react";
import type { RoadmapEpic } from "@/types/roadmap";
import {
	type ExplorerSearchResult,
	RoadmapStructureHeader,
} from "../../panels/explorer/RoadmapStructureHeader";
import { FIRST_EPIC_EXTRA_HEIGHT, LEFT_WIDTH, ROW_HEIGHT } from "./constants";

interface MilestonesLeftPanelProps {
	leftHeaderRef: RefObject<HTMLDivElement | null>;
	sortedEpics: RoadmapEpic[];
	collapsed: Set<string>;
	hasAnyDates: boolean;
	hasAnyExpanded: boolean;
	showCollapseToggle: boolean;
	onToggleEpic: (epicId: string) => void;
	onToggleCollapseAll: () => void;
	onSearchResultSelect: (result: ExplorerSearchResult) => void;
	setEpicRowRef: (epicId: string) => (node: HTMLDivElement | null) => void;
	setFeatureRowRef: (
		featureId: string,
	) => (node: HTMLDivElement | null) => void;
	onNavigateToEpic?: (epicId: string) => void;
}

export const MilestonesLeftPanel = ({
	leftHeaderRef,
	sortedEpics,
	collapsed,
	hasAnyDates,
	hasAnyExpanded,
	showCollapseToggle,
	onToggleEpic,
	onToggleCollapseAll,
	onSearchResultSelect,
	setEpicRowRef,
	setFeatureRowRef,
	onNavigateToEpic,
}: MilestonesLeftPanelProps) => {
	return (
		<div
			className="shrink-0 border-r border-gray-200 bg-white"
			style={{ width: LEFT_WIDTH }}
		>
			<div className="sticky top-0 z-40 border-b border-gray-200 bg-white">
				<div ref={leftHeaderRef}>
					<RoadmapStructureHeader
						epics={sortedEpics}
						hasAnyExpanded={hasAnyExpanded}
						onToggleCollapseAll={onToggleCollapseAll}
						onSearchResultSelect={onSearchResultSelect}
						showCollapseToggle={showCollapseToggle}
						className="px-4 py-4 bg-white min-w-0"
					/>
				</div>
			</div>

			{!hasAnyDates && (
				<div className="py-24 text-center opacity-0">
					<div>
						<BarChart2 className="w-12 h-12 mx-auto mb-4" />
						<p className="font-medium text-base">No dates set yet</p>
						<p className="text-sm mt-1 max-w-xs mx-auto">
							Add start and end dates to features to see them on the timeline
						</p>
					</div>
				</div>
			)}

			{sortedEpics.map((epic, epicIndex) => {
				const isCollapsed = collapsed.has(epic.id);
				const features = epic.features ?? [];
				const epicRowHeight =
					ROW_HEIGHT + (epicIndex === 0 ? FIRST_EPIC_EXTRA_HEIGHT : 0);

				return (
					<div key={`left-${epic.id}`}>
						<div
							ref={setEpicRowRef(epic.id)}
							style={{ height: epicRowHeight }}
							className="group/epic bg-white px-4"
						>
							<div className="flex h-full min-w-0 items-center gap-1">
								<div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 pr-10 text-sm font-medium text-gray-900 transition-all hover:bg-white hover:shadow-sm">
									<button
										type="button"
										onClick={() => onToggleEpic(epic.id)}
										className="cursor-pointer rounded p-0.5 hover:bg-black/5"
										aria-label={isCollapsed ? "Expand epic" : "Collapse epic"}
									>
										{isCollapsed ? (
											<ChevronRight className="h-4 w-4 text-gray-500" />
										) : (
											<ChevronDown className="h-4 w-4 text-gray-500" />
										)}
									</button>
									<button
										type="button"
										onClick={() => onToggleEpic(epic.id)}
										className="min-w-0 flex-1 truncate text-left text-sm text-gray-900"
										title={epic.title}
									>
										{epic.title}
									</button>
									{features.length > 0 && (
										<span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-normal text-gray-500">
											{features.length}
										</span>
									)}
								</div>
								<button
									type="button"
									onClick={() => onNavigateToEpic?.(epic.id)}
									className="shrink-0 rounded-lg border border-gray-200 bg-white p-2 text-blue-700 transition-all hover:bg-blue-50"
									title="Navigate to epic"
									aria-label={`Navigate to ${epic.title}`}
								>
									<ExternalLink className="h-3 w-3" />
								</button>
							</div>
						</div>

						{!isCollapsed &&
							features.map((feature) => (
								<div
									key={`left-feature-${feature.id}`}
									ref={setFeatureRowRef(feature.id)}
									className="relative bg-white pr-4 pl-10"
									style={{ height: ROW_HEIGHT }}
								>
									<div className="flex h-full w-full min-w-0 items-center gap-1.5 rounded-md border border-transparent px-2.5 pl-6 py-1.5 text-sm text-gray-700 transition-all hover:border-gray-200 hover:bg-white hover:shadow-sm">
										<ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
										<span className="min-w-0 flex-1 truncate text-left">
											{feature.title}
										</span>
										{(feature.tasks?.length ?? 0) > 0 && (
											<span className="pr-7 text-xs font-normal text-gray-500">
												{feature.tasks?.length}
											</span>
										)}
									</div>
								</div>
							))}
					</div>
				);
			})}
		</div>
	);
};
