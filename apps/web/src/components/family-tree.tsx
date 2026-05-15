import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Background,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  ConnectionLineType,
  Panel,
  Position,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type Node,
  type Edge,
  type NodeTypes,
  type NodeMouseHandler,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";

import "@xyflow/react/dist/style.css";

import FamilyTreeNode from "./family-tree-node";
import type { FamilyNodeData } from "./family-tree-node";
import { initialNodes, initialEdges } from "./family-tree-data";
import { NodeContextMenu, type ContextMenuAction } from "./node-context-menu";
import { AddPersonDialog, type PersonFormData } from "./add-person-dialog";

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 64;

const nodeTypes: NodeTypes = {
  family: FamilyTreeNode,
};

function getLayoutedElements(nodes: Node<FamilyNodeData>[], edges: Edge[], direction = "TB") {
  const isHorizontal = direction === "LR";

  const spouseEdges = edges.filter((e) => e.label === "spouse");

  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  const nodeMap = new Map(newNodes.map((n) => [n.id, n]));
  const gap = 24;

  spouseEdges.forEach((edge) => {
    const a = nodeMap.get(edge.source);
    const b = nodeMap.get(edge.target);
    if (!a || !b) return;

    if (isHorizontal) {
      const midY = (a.position.y + b.position.y + nodeHeight) / 2;
      a.position.y = midY - nodeHeight;
      b.position.y = midY;
    } else {
      const aCenterY = a.position.y + nodeHeight / 2;
      const bCenterY = b.position.y + nodeHeight / 2;
      const avgY = (aCenterY + bCenterY) / 2;
      a.position.y = avgY - nodeHeight / 2;
      b.position.y = avgY - nodeHeight / 2;

      const aCenterX = a.position.x + nodeWidth / 2;
      const bCenterX = b.position.x + nodeWidth / 2;
      const dist = Math.abs(aCenterX - bCenterX);
      if (dist < nodeWidth + gap) {
        const midX = (aCenterX + bCenterX) / 2;
        a.position.x = midX - nodeWidth / 2 - gap / 2;
        b.position.x = midX + gap / 2;
      }
    }
  });

  return { nodes: newNodes, edges };
}

const layouted = getLayoutedElements(initialNodes, initialEdges);

let nextId = 14;
function generateId() {
  return String(nextId++);
}

function findParents(nodeId: string, allEdges: Edge[]): string[] {
  return allEdges
    .filter((e) => e.target === nodeId && !e.label)
    .map((e) => e.source);
}

function findSpouse(nodeId: string, allEdges: Edge[]): string | null {
  const spouseEdge = allEdges.find(
    (e) => e.label === "spouse" && (e.source === nodeId || e.target === nodeId),
  );
  if (!spouseEdge) return null;
  return spouseEdge.source === nodeId ? spouseEdge.target : spouseEdge.source;
}

function findMother(
  targetId: string,
  allNodes: Node<FamilyNodeData>[],
  allEdges: Edge[],
): string | null {
  const target = allNodes.find((n) => n.id === targetId);
  if (!target) return null;
  const data = target.data as unknown as FamilyNodeData;
  if (data.gender === "female") return targetId;
  const spouseId = findSpouse(targetId, allEdges);
  if (!spouseId) return null;
  const spouse = allNodes.find((n) => n.id === spouseId);
  if (!spouse) return null;
  const spouseData = spouse.data as unknown as FamilyNodeData;
  return spouseData.gender === "female" ? spouseId : null;
}

export type FamilyTreeHandle = { addMember: () => void; exportTree: () => void };

export const FamilyTree = forwardRef<FamilyTreeHandle>(function FamilyTree(_props, ref) {
  return (
    <ReactFlowProvider>
      <FamilyTreeInner ref={ref} />
    </ReactFlowProvider>
  );
});

const FamilyTreeInner = forwardRef<FamilyTreeHandle>(function FamilyTreeInner(_props, ref) {
  const [nodes, setNodes, onNodesChange] = useNodesState(layouted.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layouted.edges);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
    nodeData: FamilyNodeData;
  } | null>(null);

  const [dialogState, setDialogState] = useState<{
    open: boolean;
    action: ContextMenuAction;
    targetId: string;
    targetData: FamilyNodeData;
  }>({
    open: false,
    action: "spouse",
    targetId: "",
    targetData: { label: "", generation: 0 },
  });

  const stats = useMemo(() => {
    const memberCount = nodes.length;
    const living = nodes.filter((n) => {
      const s = (n.data as unknown as FamilyNodeData).subtitle;
      return !s || !/^\d{4}-\d{4}$/.test(s);
    }).length;
    const generations = new Set(nodes.map((n) => (n.data as unknown as FamilyNodeData).generation)).size;
    return { memberCount, living, generations };
  }, [nodes]);

  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const layoutDirectionRef = useRef("TB");

  useImperativeHandle(ref, () => ({
    addMember: () => {
      setDialogState({
        open: true,
        action: "add",
        targetId: "",
        targetData: { label: "", generation: 0 },
      });
    },
    exportTree: () => {
      const data = JSON.stringify({ nodes, edges }, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "family-tree.json";
      a.click();
      URL.revokeObjectURL(url);
    },
  }));

  const relayout = useCallback(
    (newNodes: Node<FamilyNodeData>[], newEdges: Edge[], direction?: string) => {
      const dir = direction ?? layoutDirectionRef.current;
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        newNodes,
        newEdges,
        dir,
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    },
    [setNodes, setEdges],
  );

  const navigate = useNavigate();

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge({ ...params, type: ConnectionLineType.SmoothStep, animated: true }, eds),
      );
    },
    [setEdges],
  );

  const onNodeClick = useCallback<NodeMouseHandler>(
    (_, node) => {
      navigate({ to: "/person/$id", params: { id: node.id } });
    },
    [navigate],
  );

  const onNodeContextMenu = useCallback<NodeMouseHandler>(
    (event, node) => {
      event.preventDefault();
      const nodeData = node.data as unknown as FamilyNodeData;
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
        nodeData,
      });
    },
    [],
  );

  const onLayout = useCallback(
    (direction: string) => {
      layoutDirectionRef.current = direction;
      relayout(nodes as Node<FamilyNodeData>[], edges);
    },
    [nodes, edges, relayout],
  );

  const handleContextMenuAction = useCallback(
    (action: ContextMenuAction) => {
      if (!contextMenu) return;
      if (action === "delete") {
        const newNodes = nodes.filter((n) => n.id !== contextMenu.nodeId);
        const newEdges = edges.filter(
          (e) =>
            e.source !== contextMenu.nodeId && e.target !== contextMenu.nodeId,
        );
        relayout(newNodes, newEdges);
        return;
      }
      setDialogState({
        open: true,
        action,
        targetId: contextMenu.nodeId,
        targetData: contextMenu.nodeData,
      });
    },
    [contextMenu, nodes, edges, relayout],
  );

  const handleDialogConfirm = useCallback(
    (data: PersonFormData) => {
      if (!dialogState.open) return;

      const { action, targetId, targetData } = dialogState;
      const newId = generateId();
      let newGeneration = targetData.generation;
      const fullName = `${data.firstName} ${data.lastName}`;

      switch (action) {
        case "add":
          newGeneration = 0;
          break;
        case "spouse":
        case "sibling":
          break;
        case "child":
          newGeneration = targetData.generation + 1;
          break;
        case "parent":
          newGeneration = targetData.generation - 1;
          break;
      }

      const newNode: Node<FamilyNodeData> = {
        id: newId,
        type: "family",
        position: { x: 0, y: 0 },
        data: {
          label: fullName,
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender,
          generation: newGeneration,
          dateOfBirth: data.dateOfBirth,
          dateOfDeath: data.dateOfDeath,
          notes: data.notes,
          photo: data.photo,
          relationshipType: data.relationshipType,
        },
      };

      const newEdges: Edge[] = [];

      switch (action) {
        case "add":
          break;
        case "spouse": {
          newEdges.push({
            id: `e${targetId}-${newId}`,
            source: targetId,
            target: newId,
            sourceHandle: "right",
            targetHandle: "left",
            type: "straight",
            style: { stroke: "#7D6B3D" },
            label: "spouse",
          });
          break;
        }
        case "child": {
          const motherId = findMother(targetId, nodes, edges) ?? targetId;
          newEdges.push({
            id: `e${motherId}-${newId}`,
            source: motherId,
            target: newId,
            sourceHandle: "bottom",
            targetHandle: "top",
            type: "smoothstep",
            style: { stroke: "#8C8782", strokeWidth: 1.5 },
          });
          break;
        }
        case "parent": {
          newEdges.push({
            id: `e${newId}-${targetId}`,
            source: newId,
            target: targetId,
            sourceHandle: "bottom",
            targetHandle: "top",
            type: "smoothstep",
            style: { stroke: "#8C8782", strokeWidth: 1.5 },
          });
          break;
        }
        case "sibling": {
          const parents = findParents(targetId, edges);
          parents.forEach((parentId) => {
            newEdges.push({
              id: `e${parentId}-${newId}`,
              source: parentId,
              target: newId,
              sourceHandle: "bottom",
              targetHandle: "top",
              type: "smoothstep",
              style: { stroke: "#8C8782", strokeWidth: 1.5 },
            });
          });
          break;
        }
      }

      const allNodes = [...nodes, newNode];
      const allEdges = [...edges, ...newEdges];
      setDialogState((prev) => ({ ...prev, open: false }));
      relayout(allNodes, allEdges);
    },
    [dialogState, nodes, edges, relayout],
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      type: ConnectionLineType.SmoothStep,
      style: { stroke: "#8C8782", strokeWidth: 1.5 },
    }),
    [],
  );

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeContextMenu={onNodeContextMenu}
        onNodeClick={onNodeClick}
        connectionLineType={ConnectionLineType.SmoothStep}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        colorMode="light"
      >
        <Panel position="top-right" className="flex gap-2">
          <button
            onClick={() => zoomIn()}
            className="rounded-lg border border-[#D6D0BE] bg-[#F5F2E9] px-2.5 py-1.5 text-xs font-medium text-[#2D2926] hover:bg-white"
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={() => zoomOut()}
            className="rounded-lg border border-[#D6D0BE] bg-[#F5F2E9] px-2.5 py-1.5 text-xs font-medium text-[#2D2926] hover:bg-white"
            title="Zoom out"
          >
            -
          </button>
          <button
            onClick={() => fitView({ padding: 0.2 })}
            className="rounded-lg border border-[#D6D0BE] bg-[#F5F2E9] px-2.5 py-1.5 text-xs font-medium text-[#2D2926] hover:bg-white"
            title="Fit view"
          >
            Fit
          </button>
          <div className="w-px bg-[#D6D0BE]" />
          <button
            onClick={() => onLayout("TB")}
            className="rounded-lg border border-[#D6D0BE] bg-[#F5F2E9] px-3 py-1.5 text-xs font-medium text-[#2D2926] hover:bg-white"
          >
            Vertical
          </button>
          <button
            onClick={() => onLayout("LR")}
            className="rounded-lg border border-[#D6D0BE] bg-[#F5F2E9] px-3 py-1.5 text-xs font-medium text-[#2D2926] hover:bg-white"
          >
            Horizontal
          </button>
        </Panel>
        <Panel position="bottom-left" className="rounded-lg border border-[#D6D0BE] bg-[#F5F2E9]/90 px-3 py-2 text-xs text-[#2D2926] backdrop-blur-sm shadow-sm">
          <div className="flex gap-4">
            <span><strong>{stats.memberCount}</strong> members</span>
            <span><strong>{stats.living}</strong> living</span>
            <span><strong>{stats.generations}</strong> generations</span>
            <span className="text-[#8C8782]">updated today</span>
          </div>
        </Panel>
        <Background gap={20} size={1} color="#D6D0BE" />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(n) => {
            const d = n.data as FamilyNodeData;
            return d?.gender === "female" ? "#A0866D" : "#7D6B3D";
          }}
          maskColor="rgba(0,0,0,0.1)"
          style={{ background: "#F5F2E9", border: "1px solid #D6D0BE", borderRadius: 8 }}
        />
      </ReactFlow>

      {contextMenu && (
        <NodeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          label={contextMenu.nodeData.label}
          onAction={handleContextMenuAction}
          onClose={() => setContextMenu(null)}
        />
      )}

      <AddPersonDialog
        open={dialogState.open}
        onOpenChange={(open) =>
          setDialogState((prev) => ({ ...prev, open }))
        }
        action={dialogState.action}
        onConfirm={handleDialogConfirm}
      />
    </>
  );
});
