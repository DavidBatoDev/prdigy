import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
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
import type { Roadmap, RoadmapEpic, RoadmapFeature } from "@/types/roadmap";

interface RoadmapViewProps {
  roadmap: Roadmap;
  epics: RoadmapEpic[];
  onUpdateEpic: (epic: RoadmapEpic) => void;
  onDeleteEpic: (epicId: string) => void;
  onUpdateFeature: (feature: RoadmapFeature) => void;
  onDeleteFeature: (featureId: string) => void;
  onSelectFeature?: (feature: RoadmapFeature) => void;
  onSelectEpic?: (epicId: string) => void;
  onAddEpicBelow?: (epicId: string) => void;
  onAddFeature?: (epicId: string) => void;
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
  onAddEpicBelow,
  onAddFeature,
  onEditFeature,
  onNavigateToEpic,
}: RoadmapViewProps) => {
  const [zoom, setZoom] = useState(1);

  const DEFAULT_VIEWPORT_X = -50;
  const DEFAULT_VIEWPORT_Y = 0;
  const MAX_ZOOM = 1.0;
  const MIN_ZOOM = 0.6;

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

    return getLayoutedElements(allNodes, allEdges, epics);
  }, [
    epics,
    onUpdateEpic,
    onDeleteEpic,
    onUpdateFeature,
    onDeleteFeature,
    onSelectFeature,
    onEditFeature,
    onNavigateToEpic,
    getEdgeColor,
  ]);

  const translateExtent = useMemo((): [[number, number], [number, number]] => {
    if (!nodes.length) {
      return [
        [-1000, -400],
        [2000, 800],
      ];
    }

    const yPositions = nodes.map((node) => node.position.y);
    const minY = Math.min(...yPositions) - 240; // padding above first row
    const maxY = Math.max(...yPositions) + 720; // padding below tallest group

    return [
      [-1000, minY],
      [2000, maxY],
    ];
  }, [nodes]);

  const onNodesChange = useCallback(() => {
    // Handle node changes if needed (e.g., dragging)
  }, []);

  const onEdgesChange = useCallback(() => {
    // Handle edge changes if needed
  }, []);

  return (
    <div className="w-full h-full bg-linear-to-br from-[color-mix(in_srgb,_var(--primary-light)_5%,_white)] via-[color-mix(in_srgb,_var(--secondary-light)_8%,_white)] to-[color-mix(in_srgb,_var(--primary)_3%,_white)] relative">
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
          zoom: MAX_ZOOM,
        }}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        translateExtent={translateExtent}
        panOnDrag={false}
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        defaultEdgeOptions={{
          type: "simplebezier",
        }}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === "epicWidget") return "#9ca3af";
            if (node.type === "featureWidget") return "#f59e0b";
            return "#6b7280";
          }}
          className="bg-white border border-gray-300 rounded-lg"
        />
      </ReactFlow>
      <div className="absolute bottom-4 right-4 bg-white/90 border border-gray-200 rounded-md px-2 py-1 text-xs text-gray-700 shadow-sm">
        Zoom {Math.round(zoom * 100)}%
      </div>
    </div>
  );
};
