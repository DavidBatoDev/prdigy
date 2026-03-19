import { ChevronRight, ExternalLink, FolderOpen, Plus, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Message } from "./ChatPanel";
import { useEpics, useRoadmapStore } from "@/stores/roadmapStore";
import {
	getSortedEpics,
	type ExplorerSearchResult,
	ROADMAP_STRUCTURE_EXPLORER_CONFIG,
	RoadmapStructureHeader,
} from "./explorer/RoadmapStructureHeader";

export type { Message } from "./ChatPanel";

interface RoadmapLeftSidePanelProps {
	messages: Message[];
	onSendMessage: (message: string) => void;
	isGenerating?: boolean;
	isCollapsed?: boolean;
	onSelectEpic?: (epicId: string) => void;
	onSelectFeature?: (epicId: string, featureId: string) => void;
	onSelectTask?: (taskId: string) => void;
	onOpenEpicEditor?: (epicId: string) => void;
	onOpenFeatureEditor?: (epicId: string, featureId: string) => void;
	onOpenTaskDetail?: (taskId: string) => void;
	onNavigateToNode?: (nodeId: string, options?: { offsetX?: number }) => void;
	onNavigateToEpicTab?: (epicId: string) => void;
	highlightedEpicId?: string | null;
}

const TASK_NAVIGATE_OFFSET_X = 620;

export function RoadmapLeftSidePanel({
	messages: _messages,
	onSendMessage: _onSendMessage,
	isGenerating: _isGenerating = false,
	isCollapsed = false,
	onSelectEpic,
	onSelectFeature,
	onSelectTask,
	onOpenEpicEditor,
	onOpenFeatureEditor,
	onOpenTaskDetail,
	onNavigateToNode,
	onNavigateToEpicTab,
	highlightedEpicId,
}: RoadmapLeftSidePanelProps) {
	return (
		<div className="h-full w-full flex bg-white">
			{/* Main Content Area - Hidden when collapsed */}
			{!isCollapsed && (
				<div className="flex-1 min-w-0 flex flex-col overflow-hidden">
					<ExplorerPanel
						onSelectEpic={onSelectEpic}
						onSelectFeature={onSelectFeature}
						onSelectTask={onSelectTask}
						onOpenEpicEditor={onOpenEpicEditor}
						onOpenFeatureEditor={onOpenFeatureEditor}
						onOpenTaskDetail={onOpenTaskDetail}
						onNavigateToNode={onNavigateToNode}
						onNavigateToEpicTab={onNavigateToEpicTab}
						highlightedEpicId={highlightedEpicId}
					/>
				</div>
			)}
		</div>
	);
}

interface ExplorerPanelProps {
	onSelectEpic?: (epicId: string) => void;
	onSelectFeature?: (epicId: string, featureId: string) => void;
	onSelectTask?: (taskId: string) => void;
	onOpenEpicEditor?: (epicId: string) => void;
	onOpenFeatureEditor?: (epicId: string, featureId: string) => void;
	onOpenTaskDetail?: (taskId: string) => void;
	onNavigateToNode?: (nodeId: string, options?: { offsetX?: number }) => void;
	onNavigateToEpicTab?: (epicId: string) => void;
	highlightedEpicId?: string | null;
}

function ExplorerPanel({
	onSelectEpic,
	onSelectFeature,
	onSelectTask,
	onOpenEpicEditor,
	onOpenFeatureEditor,
	onOpenTaskDetail,
	onNavigateToNode,
	onNavigateToEpicTab,
	highlightedEpicId,
}: ExplorerPanelProps) {
	const NAVIGATION_OPEN_DELAY_MS = 700;

	// Subscribe to epics from store
	const epics = useEpics();
	const { openAddFeatureModal, openAddTaskPanel } = useRoadmapStore();
	const explorerConfig = ROADMAP_STRUCTURE_EXPLORER_CONFIG.roadmap;
	const delayedOpenTimeouts = useRef<number[]>([]);
	const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(
		new Set(),
	);

	const runAfterNavigationDelay = (callback: () => void) => {
		const timeoutId = window.setTimeout(() => {
			callback();
			delayedOpenTimeouts.current = delayedOpenTimeouts.current.filter(
				(id) => id !== timeoutId,
			);
		}, NAVIGATION_OPEN_DELAY_MS);
		delayedOpenTimeouts.current.push(timeoutId);
	};

	useEffect(() => {
		return () => {
			delayedOpenTimeouts.current.forEach((timeoutId) => {
				window.clearTimeout(timeoutId);
			});
			delayedOpenTimeouts.current = [];
		};
	}, []);

	const getTaskTextClasses = (status?: string) => {
		switch (status) {
			case "done":
				return "text-gray-400 line-through";
			case "in_progress":
				return "text-blue-600";
			case "in_review":
				return "text-orange-600";
			case "blocked":
				return "text-red-600";
			case "todo":
			default:
				return "text-gray-600";
		}
	};

	const getTaskDotClasses = (status?: string) => {
		switch (status) {
			case "done":
				return "bg-gray-400";
			case "in_progress":
				return "bg-blue-500";
			case "in_review":
				return "bg-orange-500";
			case "blocked":
				return "bg-red-500";
			case "todo":
			default:
				return "bg-gray-400";
		}
	};

	const handleSearchResultClick = (result: ExplorerSearchResult) => {
		if (result.type === "epic") {
			onSelectEpic?.(result.id);
			onNavigateToNode?.(result.id);
		} else if (result.type === "feature" && result.epicId) {
			if (result.id) {
				setExpandedFeatures((prev) => new Set(prev).add(result.id));
			}
			onSelectFeature?.(result.epicId, result.id);
			onNavigateToNode?.(result.id);
		} else if (result.type === "task") {
			const featureId = result.featureId;
			if (featureId) {
				setExpandedFeatures((prev) => new Set(prev).add(featureId));
			}
			onSelectTask?.(result.id);
			if (featureId) {
				onNavigateToNode?.(featureId, {
					offsetX: TASK_NAVIGATE_OFFSET_X,
				});
			}
		}
	};

	const sortedEpics = getSortedEpics(epics);
	const collapsableFeatureIds =
		explorerConfig.allowFeatureCollapse && explorerConfig.showTaskRows
			? sortedEpics.flatMap((epic) =>
					(epic.features || [])
						.filter((feature) => (feature.tasks?.length || 0) > 0)
						.map((feature) => feature.id),
				)
			: [];

	const hasAnyExpanded =
		explorerConfig.allowFeatureCollapse &&
		collapsableFeatureIds.some((id) => expandedFeatures.has(id));

	const handleToggleCollapseAll = () => {
		if (!explorerConfig.allowFeatureCollapse) {
			return;
		}
		if (hasAnyExpanded) {
			setExpandedFeatures(new Set());
			return;
		}
		setExpandedFeatures(new Set(collapsableFeatureIds));
	};

	const handleResetToDefaultCollapse = () => {
		setExpandedFeatures(new Set());
	};

	const toggleFeature = (featureId: string) => {
		setExpandedFeatures((prev) => {
			const next = new Set(prev);
			if (next.has(featureId)) {
				next.delete(featureId);
			} else {
				next.add(featureId);
			}
			return next;
		});
	};

	return (
		<div className="flex flex-col h-full min-w-0 overflow-hidden bg-white ">
			<RoadmapStructureHeader
				epics={sortedEpics}
				hasAnyExpanded={hasAnyExpanded}
				onToggleCollapseAll={handleToggleCollapseAll}
				onSearchResultSelect={handleSearchResultClick}
				footerContent={
					<button
						type="button"
						onClick={handleResetToDefaultCollapse}
						className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
						title="Reset to default collapse"
						aria-label="Reset to default collapse"
					>
						<RotateCcw className="w-3.5 h-3.5" />
					</button>
				}
			/>

			{/* Navigation Tree */}
			<div className="flex-1 overflow-y-auto px-3 pl-4 py-3 pt-2 hide-scrollbar">
				{sortedEpics.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full px-4 text-center">
						<div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
							<FolderOpen className="w-8 h-8 text-gray-400" />
						</div>
						<h3 className="text-sm font-semibold text-gray-900 mb-1">
							No roadmap structure yet
						</h3>
						<p className="text-xs text-gray-500 leading-relaxed">
							Your epics, features, and tasks will appear here once you start
							building your roadmap.
						</p>
					</div>
				) : (
					<div className="space-y-1">
						{sortedEpics.map((epic) => {
							const isEpicExpanded = true;
							const isEpicHighlighted = highlightedEpicId === epic.id;
							const features = (epic.features || []).sort(
								(a, b) => a.position - b.position,
							);

							return (
								<div key={epic.id} className="min-w-0">
									{/* Epic */}
									<div className="group relative flex items-center gap-1 min-w-0">
										<div
											className={`flex-1 min-w-0 flex items-center gap-2 px-3 py-2 pr-12 text-sm font-medium rounded-lg transition-all border ${
												isEpicHighlighted
													? "text-primary bg-orange-50 border-orange-200 shadow-sm"
													: "text-gray-900 bg-gray-50 border-gray-200 hover:bg-white hover:shadow-sm"
											}`}
										>
											<ChevronRight
												className={`w-4 h-4 transition-transform rotate-90 ${
													isEpicHighlighted ? "text-primary" : "text-gray-500"
												}`}
											/>
											<span
												onClick={() => {
													onSelectEpic?.(epic.id);
													onNavigateToNode?.(epic.id);
												}}
												onDoubleClick={() => {
													runAfterNavigationDelay(() => {
														onOpenEpicEditor?.(epic.id);
													});
												}}
												className="truncate flex-1 min-w-0 text-left hover:text-primary transition-colors cursor-pointer"
												title={epic.title}
											>
												{epic.title}
											</span>
											{features.length > 0 && (
												<span className="text-xs font-normal text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
													{features.length}
												</span>
											)}
										</div>
										{/* Quick Add Feature Button - Absolutely positioned */}
										<button
											type="button"
											onClick={() => openAddFeatureModal(epic.id)}
											className="absolute right-10 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center w-7 h-7 text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-primary hover:text-primary shadow-sm"
											title="Add feature to epic"
										>
											<Plus className="w-3.5 h-3.5" />
										</button>
										<button
											type="button"
											onClick={() => onNavigateToEpicTab?.(epic.id)}
											className="shrink-0 inline-flex items-center gap-1 px-2 py-2 text-xs font-medium text-blue-700 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors"
											title="Navigate to epic"
										>
											<ExternalLink className="w-3 h-3" />
										</button>
									</div>

									{/* Features */}
									{isEpicExpanded && features.length > 0 && (
										<div className="ml-6 mt-1.5 space-y-1 pl-3">
											{features.map((feature) => {
												const isFeatureExpanded = expandedFeatures.has(feature.id);
												const tasks = (feature.tasks || []).sort(
													(a, b) => a.position - b.position,
												);
												const canCollapseFeature =
													explorerConfig.allowFeatureCollapse &&
													explorerConfig.showTaskRows &&
													tasks.length > 0;

												return (
													<div key={feature.id} className="min-w-0">
														{/* Feature */}
														<div className="group relative h-11 w-full min-w-0 flex items-center gap-1.5 px-2.5 pr-10 text-sm text-gray-700 hover:bg-white hover:shadow-sm rounded-md transition-all border border-transparent hover:border-gray-200">
															{canCollapseFeature ? (
																<button
																	type="button"
																	onClick={(event) => {
																		event.stopPropagation();
																		toggleFeature(feature.id);
																	}}
																	className="p-0.5 hover:bg-black/5 rounded cursor-pointer"
																	aria-label={
																		isFeatureExpanded
																			? "Collapse feature"
																			: "Expand feature"
																	}
																>
																	<ChevronRight
																		className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
																			isFeatureExpanded ? "rotate-90" : ""
																		}`}
																	/>
																</button>
															) : (
																<div className="w-2 h-2 rounded-full bg-gray-300 ml-1 mr-0.5" />
															)}
															<span
																onClick={() => {
																	onSelectFeature?.(epic.id, feature.id);
																	onNavigateToNode?.(feature.id);
																}}
																onDoubleClick={() => {
																	runAfterNavigationDelay(() => {
																		onOpenFeatureEditor?.(epic.id, feature.id);
																	});
																}}
																className="truncate flex-1 min-w-0 text-left hover:text-primary transition-colors cursor-pointer"
																title={feature.title}
															>
																{feature.title}
															</span>
															{tasks.length > 0 && (
																<span className="text-xs font-normal text-gray-500">
																	{tasks.length}
																</span>
															)}
															{/* Quick Add Task Button - Absolutely positioned */}
															<button
																type="button"
																onClick={() => openAddTaskPanel(feature.id)}
																className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center w-6 h-6 text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 hover:border-primary hover:text-primary shadow-sm"
																title="Add task to feature"
															>
																<Plus className="w-3 h-3" />
															</button>
														</div>

														{/* Tasks */}
														{explorerConfig.showTaskRows &&
															isFeatureExpanded &&
															tasks.length > 0 && (
																<div className="ml-5 mt-1 space-y-0.5 pl-2">
																	{tasks.map((task) => (
																		<button
																			key={task.id}
																			onClick={() => {
																				onSelectTask?.(task.id);
																				onNavigateToNode?.(feature.id, {
																					offsetX: TASK_NAVIGATE_OFFSET_X,
																				});
																			}}
																			className="w-full flex items-center gap-2 px-2 py-1 text-xs hover:bg-white rounded transition-colors"
																		>
																			<div
																				className={`w-1.5 h-1.5 rounded-full ${getTaskDotClasses(task.status)}`}
																			/>
																			<span
																				onClick={(event) => {
																					event.stopPropagation();
																					onNavigateToNode?.(feature.id, {
																						offsetX: TASK_NAVIGATE_OFFSET_X,
																					});
																				}}
																				onDoubleClick={(event) => {
																					event.stopPropagation();
																					runAfterNavigationDelay(() => {
																						onOpenTaskDetail?.(task.id);
																					});
																				}}
																				className={`truncate text-left flex-1 transition-colors hover:text-primary ${getTaskTextClasses(task.status)}`}
																				title="Focus in canvas"
																			>
																				{task.title}
																			</span>
																		</button>
																	))}
																</div>
															)}
													</div>
												);
											})}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
