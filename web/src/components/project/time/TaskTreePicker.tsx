import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ProjectTaskOption } from "@/services/project-time.service";

type FeatureGroup = {
  featureTitle: string;
  featurePosition?: number;
  tasks: ProjectTaskOption[];
};

type EpicGroup = {
  epicTitle: string;
  epicPosition?: number;
  features: FeatureGroup[];
};

interface TaskTreePickerProps {
  tasks: ProjectTaskOption[];
  value: string;
  disabled?: boolean;
  placeholder?: string;
  selectedLabelMode?: "task" | "path";
  triggerClassName?: string;
  panelClassName?: string;
  onChange: (taskId: string) => void;
}

const UNTITLED_EPIC = "Untitled epic";
const UNTITLED_FEATURE = "Untitled feature";
const UNTITLED_TASK = "Untitled task";

const getTaskLabel = (task: ProjectTaskOption) => {
  const segments = [task.epic_title, task.feature_title, task.title].filter(
    (segment): segment is string => Boolean(segment && segment.trim()),
  );
  return segments.length > 0 ? segments.join(" -> ") : UNTITLED_TASK;
};

export function TaskTreePicker({
  tasks,
  value,
  disabled = false,
  placeholder = "Select task",
  selectedLabelMode = "task",
  triggerClassName,
  panelClassName,
  onChange,
}: TaskTreePickerProps) {
  const [open, setOpen] = useState(false);
  const [expandedEpics, setExpandedEpics] = useState<Record<string, boolean>>({});
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>(
    {},
  );
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === value) ?? null,
    [tasks, value],
  );
  const selectedLabel = selectedTask
    ? selectedLabelMode === "path"
      ? getTaskLabel(selectedTask)
      : selectedTask.title || UNTITLED_TASK
    : placeholder;

  const groups = useMemo<EpicGroup[]>(() => {
    const epicMap = new Map<
      string,
      {
        position?: number;
        featureMap: Map<
          string,
          {
            position?: number;
            tasks: ProjectTaskOption[];
          }
        >;
      }
    >();
    for (const task of tasks) {
      const epicTitle = (task.epic_title || UNTITLED_EPIC).trim() || UNTITLED_EPIC;
      const featureTitle =
        (task.feature_title || UNTITLED_FEATURE).trim() || UNTITLED_FEATURE;
      if (!epicMap.has(epicTitle)) {
        epicMap.set(epicTitle, {
          position: task.epic_position,
          featureMap: new Map(),
        });
      }
      const epicEntry = epicMap.get(epicTitle);
      if (!epicEntry) continue;
      if (epicEntry.position === undefined && task.epic_position !== undefined) {
        epicEntry.position = task.epic_position;
      }
      if (!epicEntry.featureMap.has(featureTitle)) {
        epicEntry.featureMap.set(featureTitle, {
          position: task.feature_position,
          tasks: [],
        });
      }
      const featureEntry = epicEntry.featureMap.get(featureTitle);
      if (!featureEntry) continue;
      if (featureEntry.position === undefined && task.feature_position !== undefined) {
        featureEntry.position = task.feature_position;
      }
      featureEntry.tasks.push(task);
    }

    return Array.from(epicMap.entries())
      .sort(([aTitle, aEntry], [bTitle, bEntry]) => {
        const aPos = aEntry.position ?? Number.MAX_SAFE_INTEGER;
        const bPos = bEntry.position ?? Number.MAX_SAFE_INTEGER;
        if (aPos !== bPos) return aPos - bPos;
        return aTitle.localeCompare(bTitle);
      })
      .map(([epicTitle, epicEntry]) => ({
        epicTitle,
        epicPosition: epicEntry.position,
        features: Array.from(epicEntry.featureMap.entries())
          .sort(([aTitle, aEntry], [bTitle, bEntry]) => {
            const aPos = aEntry.position ?? Number.MAX_SAFE_INTEGER;
            const bPos = bEntry.position ?? Number.MAX_SAFE_INTEGER;
            if (aPos !== bPos) return aPos - bPos;
            return aTitle.localeCompare(bTitle);
          })
          .map(([featureTitle, featureEntry]) => ({
            featureTitle,
            featurePosition: featureEntry.position,
            tasks: [...featureEntry.tasks].sort((a, b) =>
              (a.title || UNTITLED_TASK).localeCompare(b.title || UNTITLED_TASK),
            ),
          })),
      }));
  }, [tasks]);

  useEffect(() => {
    if (!open) return;
    const updatePanelPosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const preferredMaxHeight = 320;
      const spaceBelow = viewportHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const placeAbove = spaceBelow < 220 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(
        160,
        Math.min(preferredMaxHeight, placeAbove ? spaceAbove : spaceBelow),
      );
      setPanelStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        top: placeAbove ? undefined : rect.bottom + 4,
        bottom: placeAbove ? viewportHeight - rect.top + 4 : undefined,
        maxHeight,
        zIndex: 250,
      });
    };
    updatePanelPosition();
    const onMouseDown = (event: MouseEvent) => {
      if (!rootRef.current || !panelRef.current) return;
      const target = event.target as Node | null;
      if (
        target &&
        !rootRef.current.contains(target) &&
        !panelRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onWindowChange = () => updatePanelPosition();
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("resize", onWindowChange);
    window.addEventListener("scroll", onWindowChange, true);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("resize", onWindowChange);
      window.removeEventListener("scroll", onWindowChange, true);
    };
  }, [open]);

  const toggleEpic = (epicTitle: string) => {
    setExpandedEpics((prev) => ({ ...prev, [epicTitle]: !prev[epicTitle] }));
  };

  const toggleFeature = (epicTitle: string, featureTitle: string) => {
    const key = `${epicTitle}::${featureTitle}`;
    setExpandedFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={
          triggerClassName ||
          "w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-left"
        }
      >
        <span className="inline-flex w-full items-center justify-between gap-2">
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-500" />
        </span>
      </button>

      {open && !disabled && panelStyle &&
        createPortal(
        <div
          ref={panelRef}
          className={
            panelClassName ||
            "max-h-72 overflow-auto rounded-md border border-gray-200 bg-white p-1 shadow-lg"
          }
          style={panelStyle}
        >
          {groups.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-gray-500">No tasks available.</p>
          ) : (
            groups.map((epicGroup) => {
              const isEpicOpen = expandedEpics[epicGroup.epicTitle] ?? false;
              return (
                <div key={epicGroup.epicTitle} className="mb-1 last:mb-0">
                  <button
                    type="button"
                    onClick={() => toggleEpic(epicGroup.epicTitle)}
                    className="flex w-full items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-100"
                  >
                    {isEpicOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                    )}
                    <span className="truncate">{epicGroup.epicTitle}</span>
                  </button>

                  {isEpicOpen && (
                    <div className="pl-3">
                      {epicGroup.features.map((featureGroup) => {
                        const featureKey = `${epicGroup.epicTitle}::${featureGroup.featureTitle}`;
                        const isFeatureOpen = expandedFeatures[featureKey] ?? false;
                        return (
                          <div key={featureKey} className="mb-1 last:mb-0">
                            <button
                              type="button"
                              onClick={() =>
                                toggleFeature(epicGroup.epicTitle, featureGroup.featureTitle)
                              }
                              className="flex w-full items-center gap-1 rounded px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                            >
                              {isFeatureOpen ? (
                                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                              )}
                              <span className="truncate">{featureGroup.featureTitle}</span>
                            </button>

                            {isFeatureOpen && (
                              <div className="pl-4">
                                {featureGroup.tasks.map((task) => (
                                  <button
                                    key={task.id}
                                    type="button"
                                    onClick={() => {
                                      onChange(task.id);
                                      setOpen(false);
                                    }}
                                    className={`block w-full truncate rounded px-2 py-1 text-left text-xs ${
                                      task.id === value
                                        ? "bg-orange-100 text-orange-800"
                                        : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                    title={task.title || UNTITLED_TASK}
                                  >
                                    {task.title || UNTITLED_TASK}
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
            })
          )}
        </div>
      , document.body)}
    </div>
  );
}
