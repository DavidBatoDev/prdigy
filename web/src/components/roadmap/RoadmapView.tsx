import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeTypes,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { EpicWidget, type EpicWidgetData } from "./EpicWidget";
import { FeatureWidget, type FeatureWidgetData } from "./FeatureWidget";
import type {
  Roadmap,
  RoadmapEpic,
  RoadmapFeature,
  RoadmapTask,
} from "@/types/roadmap";

interface RoadmapViewProps {
  roadmap: Roadmap;
  epics: RoadmapEpic[];
  onUpdateEpic: (epic: RoadmapEpic) => void;
  onDeleteEpic: (epicId: string) => void;
  onUpdateFeature: (feature: RoadmapFeature) => void;
  onDeleteFeature: (featureId: string) => void;
  onSelectFeature?: (feature: RoadmapFeature) => void;
  onSelectEpic?: (epicId: string) => void;
  onSelectTask?: (task: RoadmapTask) => void;
  onAddEpicBelow?: (epicId: string) => void;
  onAddFeature?: (epicId: string) => void;
  onAddTask?: (featureId: string) => void;
  onEditFeature?: (epicId: string, featureId: string) => void;
  onNavigateToEpic?: (epicId: string) => void;
}

// Custom layout configuration with centered epic positioning among features
const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  epics: RoadmapEpic[],
) => {
  const epicNodes = nodes.filter((node) => node.type === "epicWidget");
  const featureNodes = nodes.filter((node) => node.type === "featureWidget");

  const EPIC_X = 100;
  const FEATURE_X_OFFSET = 560; // Distance from epic to feature column
  const NODE_WIDTH = 500;
  const BASE_EPIC_HEIGHT = 220;
  const MAX_EPIC_HEIGHT = 420;
  const DESCRIPTION_LINE_HEIGHT = 16;
  const DESCRIPTION_CHARS_PER_LINE = 80;
  const BASE_FEATURE_HEIGHT = 140;
  const MAX_FEATURE_HEIGHT = 320;
  const FEATURE_DESCRIPTION_LINE_HEIGHT = 16;
  const FEATURE_DESCRIPTION_CHARS_PER_LINE = 70;
  const BASE_FEATURE_SPACING = 80; // Fallback spacing
  const MIN_FEATURE_SPACING = 0;
  const MAX_FEATURE_SPACING = 110;

  const sortedEpics = [...epics].sort((a, b) => a.position - b.position);
  const featureNodeMap = new Map(featureNodes.map((node) => [node.id, node]));

  const positionedEpicNodes: Node[] = [];
  const positionedFeatureNodes: Node[] = [];

  let currentY = 100;

  sortedEpics.forEach((epic) => {
    const epicNode = epicNodes.find((node) => node.id === epic.id);
    if (!epicNode) return;

    const featureIds = (epic.features || [])
      .map((feature) => feature.id)
      .filter((id) => featureNodeMap.has(id));

    const featureCount = featureIds.length;
    const featureHeights = (epic.features || [])
      .filter((feature) => featureIds.includes(feature.id))
      .map((feature) => {
        const featureDescriptionLength = feature.description?.length ?? 0;
        const featureEstimatedLines = Math.ceil(
          featureDescriptionLength / FEATURE_DESCRIPTION_CHARS_PER_LINE,
        );
        const featureEstimatedDescriptionHeight = Math.min(
          featureEstimatedLines * FEATURE_DESCRIPTION_LINE_HEIGHT,
          MAX_FEATURE_HEIGHT - BASE_FEATURE_HEIGHT,
        );
        return Math.min(
          MAX_FEATURE_HEIGHT,
          BASE_FEATURE_HEIGHT + featureEstimatedDescriptionHeight,
        );
      });
    const descriptionLength = epic.description?.length ?? 0;
    const estimatedDescriptionLines = Math.ceil(
      descriptionLength / DESCRIPTION_CHARS_PER_LINE,
    );
    const estimatedDescriptionHeight = Math.min(
      estimatedDescriptionLines * DESCRIPTION_LINE_HEIGHT,
      MAX_EPIC_HEIGHT - BASE_EPIC_HEIGHT,
    );
    const epicHeight = Math.min(
      MAX_EPIC_HEIGHT,
      BASE_EPIC_HEIGHT + estimatedDescriptionHeight,
    );
    const averageFeatureHeight =
      featureHeights.length > 0
        ? featureHeights.reduce((sum, height) => sum + height, 0) /
          featureHeights.length
        : BASE_FEATURE_HEIGHT;
    const featureSpacing =
      featureCount > 1
        ? Math.min(
            MAX_FEATURE_SPACING,
            Math.max(
              MIN_FEATURE_SPACING,
              Math.round(averageFeatureHeight * 0.32 + 14),
            ),
          )
        : 0;
    const totalFeatureHeight =
      featureCount > 0
        ? featureHeights.reduce((sum, height) => sum + height, 0) +
          featureSpacing * (featureCount - 1)
        : 0;
    const groupHeight = Math.max(epicHeight, totalFeatureHeight);
    const groupGap = Math.max(40, Math.round(groupHeight * 0.15));
    const epicCenterY = currentY + groupHeight / 2;
    const epicY = epicCenterY - epicHeight / 2;

    positionedEpicNodes.push({
      ...epicNode,
      width: NODE_WIDTH,
      height: epicHeight,
      position: { x: EPIC_X, y: epicY },
    });

    if (featureCount > 0) {
      let featureTopY = epicCenterY - totalFeatureHeight / 2;
      featureIds.forEach((featureId, index) => {
        const featureNode = featureNodeMap.get(featureId);
        if (!featureNode) return;
        const height = featureHeights[index] ?? BASE_FEATURE_HEIGHT;
        positionedFeatureNodes.push({
          ...featureNode,
          width: NODE_WIDTH,
          height,
          position: { x: EPIC_X + FEATURE_X_OFFSET, y: featureTopY },
        });
        featureTopY += height + featureSpacing;
      });
    }

    currentY += groupHeight + groupGap;
  });

  const positionedFeatureIds = new Set(
    positionedFeatureNodes.map((node) => node.id),
  );
  const orphanFeatureNodes = featureNodes.filter(
    (node) => !positionedFeatureIds.has(node.id),
  );

  orphanFeatureNodes.forEach((node) => {
    positionedFeatureNodes.push({
      ...node,
      width: NODE_WIDTH,
      height: BASE_FEATURE_HEIGHT,
      position: { x: EPIC_X + FEATURE_X_OFFSET, y: currentY },
    });
    currentY += BASE_FEATURE_SPACING;
  });

  const allLayoutedNodes = [...positionedEpicNodes, ...positionedFeatureNodes];

  return { nodes: allLayoutedNodes, edges };
};

export const RoadmapView = ({
  epics,
  onUpdateEpic,
  onDeleteEpic,
  onUpdateFeature,
  onDeleteFeature,
  onSelectFeature,
  onSelectEpic,
  onSelectTask,
  onAddEpicBelow,
  onAddFeature,
  onAddTask,
  onEditFeature,
  onNavigateToEpic,
}: RoadmapViewProps) => {
  const DEFAULT_ZOOM = 0.67;
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  const DEFAULT_VIEWPORT_X = -50;
  const DEFAULT_VIEWPORT_Y = 0;
  const MAX_ZOOM = 1.0;
  const MIN_ZOOM = 0.4;

  // Helper function to get edge color based on status
  const getEdgeColor = (status: RoadmapFeature["status"]) => {
    switch (status) {
      case "completed":
        return "#22c55e"; // green
      case "in_progress":
        return "#3b82f6"; // blue
      case "blocked":
        return "#ef4444"; // red
      case "in_review":
        return "#a855f7"; // purple
      default:
        return "#9ca3af"; // gray
    }
  };

  // Define custom node types
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      epicWidget: EpicWidget,
      featureWidget: FeatureWidget,
    }),
    [],
  );

  // Convert epics and features to nodes and edges
  const { nodes, edges } = useMemo(() => {
    const epicNodes: Node<EpicWidgetData>[] = epics.map((epic) => ({
      id: epic.id,
      type: "epicWidget",
      data: {
        epic,
        onEdit: onSelectEpic
          ? () => onSelectEpic(epic.id)
          : (updatedEpic) => onUpdateEpic(updatedEpic),
        onDelete: onDeleteEpic,
        onAddEpicBelow,
        onAddFeature,
        onNavigateToTab: onNavigateToEpic,
      },
      position: { x: 0, y: 0 }, // Will be set by dagre
    }));

    const allFeatures = epics.flatMap((epic) =>
      (epic.features || []).map((feature) => ({
        ...feature,
        epic_id: epic.id,
      })),
    );

    const featureNodes: Node<FeatureWidgetData>[] = allFeatures.map(
      (feature) => ({
        id: feature.id,
        type: "featureWidget",
        data: {
          feature,
          showTaskCount: true,
          onEdit: () => onEditFeature?.(feature.epic_id, feature.id),
          onDelete: onDeleteFeature,
          onClick: onSelectFeature,
          onAddTask,
          onSelectTask,
        },
        position: { x: 0, y: 0 }, // Will be set by dagre
      }),
    );

    const allNodes = [...epicNodes, ...featureNodes];

    // Create edges from epic to features
    const featureEdges: Edge[] = allFeatures.map((feature) => ({
      id: `epic-feature-${feature.epic_id}-${feature.id}`,
      source: feature.epic_id,
      sourceHandle: "epic-right",
      target: feature.id,
      type: "simplebezier",
      animated: feature.status === "in_progress",
      style: {
        stroke: getEdgeColor(feature.status),
        strokeWidth: 2,
      },
    }));

    // Create edges between consecutive epics (based on position)
    const sortedEpics = [...epics].sort((a, b) => a.position - b.position);
    const epicEdges: Edge[] = [];
    for (let i = 0; i < sortedEpics.length - 1; i++) {
      epicEdges.push({
        id: `epic-chain-${sortedEpics[i].id}-${sortedEpics[i + 1].id}`,
        source: sortedEpics[i].id,
        sourceHandle: "epic-bottom",
        target: sortedEpics[i + 1].id,
        targetHandle: "epic-top",
        type: "simplebezier",
        animated: false,
        style: {
          stroke: "#9ca3af", // gray for epic connections
          strokeWidth: 2,
          strokeDasharray: "5,5", // dashed line
        },
      });
    }

    const allEdges = [...epicEdges, ...featureEdges];

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      allNodes,
      allEdges,
      epics,
    );

    const TASK_WIDTH = 180;
    const TASK_HEIGHT = 32;
    const TASK_GAP = 8;
    const TASKS_PER_COLUMN = 3;
    const TASKS_X_OFFSET = 540;

    const featureNodeById = new Map(
      layoutedNodes
        .filter((node) => node.type === "featureWidget")
        .map((node) => [node.id, node]),
    );

    const taskMiniNodes: Node[] = allFeatures.flatMap((feature) => {
      const featureNode = featureNodeById.get(feature.id);
      const tasks = feature.tasks?.slice(0, 9) ?? [];
      if (!featureNode || tasks.length === 0) return [];

      const featureHeight = featureNode.height ?? 0;
      const gridHeight =
        TASKS_PER_COLUMN * TASK_HEIGHT + (TASKS_PER_COLUMN - 1) * TASK_GAP;
      const startY =
        featureNode.position.y + featureHeight / 2 - gridHeight / 2;

      return tasks.map((task, index) => {
        const row = index % TASKS_PER_COLUMN;
        const col = Math.floor(index / TASKS_PER_COLUMN);

        return {
          id: `task-mini-${task.id}`,
          type: "default",
          data: { minimapType: "task", status: task.status },
          position: {
            x:
              featureNode.position.x +
              TASKS_X_OFFSET +
              col * (TASK_WIDTH + TASK_GAP),
            y: startY + row * (TASK_HEIGHT + TASK_GAP),
          },
          width: TASK_WIDTH,
          height: TASK_HEIGHT,
          className: "minimap-only-node",
          draggable: false,
          selectable: false,
          connectable: false,
          focusable: false,
        } as Node;
      });
    });

    return {
      nodes: [...layoutedNodes, ...taskMiniNodes],
      edges: layoutedEdges,
    };
  }, [
    epics,
    onUpdateEpic,
    onDeleteEpic,
    onUpdateFeature,
    onDeleteFeature,
    onSelectFeature,
    onEditFeature,
    onNavigateToEpic,
    onAddTask,
    onSelectTask,
    getEdgeColor,
  ]);

  const extraRightPadding = useMemo(() => {
    const maxTaskCount = epics.reduce((maxCount, epic) => {
      const epicMax = (epic.features || []).reduce((featureMax, feature) => {
        const taskCount = feature.tasks?.length || 0;
        return Math.max(featureMax, taskCount);
      }, 0);
      return Math.max(maxCount, epicMax);
    }, 0);

    if (maxTaskCount >= 60) return 2600;
    if (maxTaskCount >= 40) return 2200;
    if (maxTaskCount >= 20) return 1800;
    return 1000;
  }, [epics]);

  const translateExtent = useMemo((): [[number, number], [number, number]] => {
    if (!nodes.length) {
      return [
        [-1000, -400],
        [2400, 800],
      ];
    }

    const xPositions = nodes.map((node) => node.position.x);
    const yPositions = nodes.map((node) => node.position.y);

    const NODE_WIDTH = 520;
    const minX = Math.min(...xPositions) - 400;
    const maxX = Math.max(...xPositions) + NODE_WIDTH + extraRightPadding;
    const minY = Math.min(...yPositions) - 240; // padding above first row
    const maxY = Math.max(...yPositions) + 720; // padding below tallest group

    return [
      [minX, minY],
      [maxX, maxY],
    ];
  }, [nodes, extraRightPadding]);

  const onNodesChange = useCallback(() => {
    // Handle node changes if needed (e.g., dragging)
  }, []);

  const onEdgesChange = useCallback(() => {
    // Handle edge changes if needed
  }, []);

  return (
    <div className="w-full h-full bg-[#F5F5F5] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onMove={(_, viewport) => {
          setZoom(viewport.zoom);
        }}
        onInit={(instance: ReactFlowInstance) => {
          setZoom(instance.getZoom());
        }}
        defaultViewport={{
          x: DEFAULT_VIEWPORT_X,
          y: DEFAULT_VIEWPORT_Y,
          zoom: DEFAULT_ZOOM,
        }}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        translateExtent={translateExtent}
        panOnDrag={[1, 2]}
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        defaultEdgeOptions={{
          type: "simplebezier",
        }}
      >
        <Controls position="top-right" />
        <MiniMap
          position="bottom-right"
          nodeStrokeWidth={1.5}
          nodeStrokeColor={(node) => {
            if (node.data?.minimapType === "task") {
              switch (node.data?.status) {
                case "done":
                  return "#047857";
                case "in_progress":
                  return "#1d4ed8";
                case "in_review":
                  return "#7e22ce";
                case "blocked":
                  return "#b91c1c";
                case "todo":
                default:
                  return "#6b7280";
              }
            }
            if (node.type === "epicWidget") return "#9ca3af";
            if (node.type === "featureWidget") return "#f59e0b";
            return "#9ca3af";
          }}
          nodeColor={(node) => {
            if (node.data?.minimapType === "task") {
              switch (node.data?.status) {
                case "done":
                  return "#10b981";
                case "in_progress":
                  return "#3b82f6";
                case "in_review":
                  return "#a855f7";
                case "blocked":
                  return "#ef4444";
                case "todo":
                default:
                  return "#9ca3af";
              }
            }
            if (node.type === "epicWidget") return "#f8fafc";
            if (node.type === "featureWidget") return "#fff7ed";
            return "#e5e7eb";
          }}
          nodeBorderRadius={6}
          maskColor="rgba(0, 0, 0, 0.04)"
          className="bg-gray-50 border border-gray-300 rounded-lg"
          style={{ width: 200, height: 140 }}
        />
      </ReactFlow>
      <div className="absolute bottom-4 right-4 bg-white/90 border border-gray-200 rounded-md px-2 py-1 text-xs text-gray-700 shadow-sm">
        Zoom {Math.round(zoom * 100)}%
      </div>
    </div>
  );
};
