import { X, Download, Share2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { RoadmapEpic } from "@/types/roadmap";
import { useRoadmapStore } from "@/stores/roadmapStore";

const LEFT_PANEL_WIDTH = 320;

interface SortableEpicTabProps {
  epic: RoadmapEpic;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

const SortableEpicTab = ({
  epic,
  isActive,
  onClick,
  onClose,
}: SortableEpicTabProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: epic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 shrink-0 cursor-pointer transition-colors text-sm font-medium ${
        isActive
          ? "text-gray-900 border-gray-900"
          : "text-gray-600 hover:text-gray-900 border-transparent"
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <span className="text-sm font-medium">{epic.title}</span>
      </div>
      <button
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className="p-0.5 rounded hover:bg-gray-200 transition-colors"
        aria-label="Close tab"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

interface RoadmapTopBarProps {
  onShare?: () => void;
  onExport?: () => void;
}

export function RoadmapTopBar({ onShare, onExport }: RoadmapTopBarProps) {
  const epics = useRoadmapStore((state) => state.epics);
  const viewMode = useRoadmapStore((state) => state.canvasViewMode);
  const selectedEpicId = useRoadmapStore((state) => state.canvasSelectedEpicId);
  const openEpicTabs = useRoadmapStore((state) => state.canvasOpenEpicTabs);
  const setViewMode = useRoadmapStore((state) => state.setCanvasViewMode);
  const setSelectedEpicId = useRoadmapStore(
    (state) => state.setCanvasSelectedEpicId,
  );
  const setOpenEpicTabs = useRoadmapStore(
    (state) => state.setCanvasOpenEpicTabs,
  );
  const closeCanvasEpicTab = useRoadmapStore(
    (state) => state.closeCanvasEpicTab,
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOpenEpicTabs((tabs) => {
        const oldIndex = tabs.indexOf(active.id as string);
        const newIndex = tabs.indexOf(over.id as string);
        return arrayMove(tabs, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="bg-gray-100 border-b border-gray-200 flex items-center justify-between w-full shrink-0 z-10 overflow-hidden">
      <div className="flex items-center overflow-x-auto flex-1 no-scrollbar h-full">
        <div
          className="flex items-center shrink-0"
          style={{ width: LEFT_PANEL_WIDTH }}
        >
          <button
            onClick={() => {
              setViewMode("roadmap");
              setSelectedEpicId(null);
            }}
            className={`w-1/2 px-4 py-3 font-medium text-sm text-center transition-colors border-b-2 shrink-0 ${
              viewMode === "roadmap"
                ? "text-orange-600 border-orange-600"
                : "text-gray-600 hover:text-gray-900 border-transparent"
            }`}
          >
            Roadmap View
          </button>
          <button
            onClick={() => setViewMode("milestones")}
            className={`w-1/2 px-4 py-3 font-medium text-sm text-center transition-colors border-b-2 shrink-0 ${
              viewMode === "milestones"
                ? "text-orange-600 border-orange-600"
                : "text-gray-600 hover:text-gray-900 border-transparent"
            }`}
          >
            Milestones
          </button>
        </div>

        {openEpicTabs.length > 0 && (
          <div className="h-8 w-px bg-gray-300 shrink-0" />
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={openEpicTabs}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex items-center gap-2">
              {openEpicTabs.map((epicId) => {
                const epic = epics.find((item) => item.id === epicId);
                if (!epic) return null;

                return (
                  <SortableEpicTab
                    key={epicId}
                    epic={epic}
                    isActive={viewMode === "epic" && selectedEpicId === epicId}
                    onClick={() => {
                      setSelectedEpicId(epicId);
                      setViewMode("epic");
                    }}
                    onClose={() => closeCanvasEpicTab(epicId)}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="flex items-center gap-2 px-6 py-2 border-l border-gray-200 bg-gray-100 shrink-0 shadow-sm relative z-20">
        {onShare && (
          <button
            onClick={onShare}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
            title="Share Roadmap"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        )}

        {onExport && (
          <button
            onClick={onExport}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors shadow-sm"
            title="Export Roadmap"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        )}
      </div>
    </div>
  );
}
