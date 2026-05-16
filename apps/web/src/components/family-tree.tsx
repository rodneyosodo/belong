import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
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
import { NodeContextMenu, type ContextMenuAction } from "./node-context-menu";
import { AddPersonDialog, type PersonFormData } from "./add-person-dialog";
import { personApi, relationshipApi, type Person, type Relationship } from "@/lib/api";

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

function personToNode(p: Person): Node<FamilyNodeData> {
  const gen = (p.metadata as Record<string, unknown>)?.generation as number ?? 0;
  return {
    id: p.id,
    type: "family",
    position: { x: 0, y: 0 },
    data: {
      label: `${p.first_name} ${p.last_name}`.trim(),
      firstName: p.first_name,
      lastName: p.last_name,
      gender: (p.gender as FamilyNodeData["gender"]) || undefined,
      generation: gen,
      dateOfBirth: p.date_of_birth || undefined,
      dateOfDeath: p.date_of_death || undefined,
      photo: p.avatar_url || undefined,
      subtitle: p.date_of_birth
        ? `${p.date_of_birth}${p.date_of_death ? `-${p.date_of_death}` : ""}`
        : undefined,
    },
  };
}

function relationshipToEdge(r: Relationship): Edge {
  const isSpouse = r.type === "spouse";
  return {
    id: r.id,
    source: r.person_a_id,
    target: r.person_b_id,
    sourceHandle: isSpouse ? "right" : "bottom",
    targetHandle: isSpouse ? "left" : "top",
    type: isSpouse ? "straight" : "smoothstep",
    style: isSpouse ? { stroke: "#7D6B3D" } : { stroke: "#8C8782", strokeWidth: 1.5 },
    label: isSpouse ? "spouse" : undefined,
  };
}

function computeGeneration(personId: string, edges: Edge[], nodes: Node<FamilyNodeData>[]): number {
  const visited = new Set<string>();
  function depth(id: string): number {
    if (visited.has(id)) return 0;
    visited.add(id);
    const parents = edges.filter((e) => e.target === id && e.type === "smoothstep");
    if (parents.length === 0) return 0;
    return 1 + Math.max(...parents.map((e) => depth(e.source)));
  }
  return depth(personId);
}

function findParents(nodeId: string, allEdges: Edge[]): string[] {
  return allEdges
    .filter((e) => e.target === nodeId && e.type === "smoothstep")
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

const GEDCOM_MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function toGedcomDate(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const d = String(Number(parts[2]));
    const m = GEDCOM_MONTHS[Number(parts[1]) - 1];
    return `${d} ${m} ${parts[0]}`;
  }
  if (parts.length === 2) {
    const m = GEDCOM_MONTHS[Number(parts[1]) - 1];
    return `${m} ${parts[0]}`;
  }
  return dateStr;
}

function toGedcom(nodes: Node<FamilyNodeData>[], edges: Edge[]): string {
  const lines: string[] = [];
  lines.push("0 HEAD");
  lines.push("1 SOUR Belong");
  lines.push("2 NAME Belong Family Tree");
  lines.push("1 CHAR UTF-8");
  lines.push("1 GEDC");
  lines.push("2 VERS 5.5.1");
  lines.push("2 FORM LINEAGE-LINKED");

  const idToXref: Record<string, string> = {};

  nodes.forEach((node, i) => {
    const xref = `I${i + 1}`;
    idToXref[node.id] = xref;
    const data = node.data as unknown as FamilyNodeData;
    const sex = data.gender === "female" ? "F" : data.gender === "male" ? "M" : undefined;

    lines.push(`0 @${xref}@ INDI`);
    const lastName = data.lastName || "";
    const firstName = data.firstName || data.label.replace(` ${lastName}`, "");
    lines.push(`1 NAME ${firstName} /${lastName}/`);
    if (sex) lines.push(`1 SEX ${sex}`);

    const birthDate = toGedcomDate(data.dateOfBirth);
    if (birthDate) {
      lines.push("1 BIRT");
      lines.push(`2 DATE ${birthDate}`);
    }
    const deathDate = toGedcomDate(data.dateOfDeath);
    if (deathDate) {
      lines.push("1 DEAT");
      lines.push(`2 DATE ${deathDate}`);
    }
  });

  let familyCount = 0;
  const visited = new Set<string>();

  const spouseEdges = edges.filter((e) => e.label === "spouse");
  for (const edge of spouseEdges) {
    const key = [edge.source, edge.target].sort().join("-");
    if (visited.has(key)) continue;
    visited.add(key);

    const husbXref = idToXref[edge.source];
    const wifeXref = idToXref[edge.target];
    const husbNode = nodes.find((n) => n.id === edge.source);
    const husbGender = (husbNode?.data as unknown as FamilyNodeData)?.gender;

    familyCount++;
    const famXref = `F${familyCount}`;
    lines.push(`0 @${famXref}@ FAM`);

    if (husbGender === "male") {
      lines.push(`1 HUSB @${husbXref}@`);
      lines.push(`1 WIFE @${wifeXref}@`);
    } else {
      lines.push(`1 HUSB @${wifeXref}@`);
      lines.push(`1 WIFE @${husbXref}@`);
    }

    const children = edges.filter(
      (e) => e.type === "smoothstep" && (e.source === edge.source || e.source === edge.target),
    );
    for (const child of children) {
      const childXref = idToXref[child.target];
      if (childXref) lines.push(`1 CHIL @${childXref}@`);
    }
  }

  const parentOnly = edges.filter(
    (e) => e.type === "smoothstep" && !spouseEdges.some((s) => s.source === e.source || s.target === e.source),
  );

  for (const edge of parentOnly) {
    const childXref = idToXref[edge.target];
    if (!childXref) continue;
    familyCount++;
    const famXref = `F${familyCount}`;
    lines.push(`0 @${famXref}@ FAM`);
    lines.push(`1 CHIL @${childXref}@`);
  }

  lines.push("0 TRLR");
  return lines.join("\n");
}

export type FamilyTreeHandle = { addMember: () => void; exportTree: () => void };
type FamilyTreeProps = { treeId: string };

export const FamilyTree = forwardRef<FamilyTreeHandle, FamilyTreeProps>(function FamilyTree({ treeId }, ref) {
  return (
    <ReactFlowProvider>
      <FamilyTreeInner ref={ref} treeId={treeId} />
    </ReactFlowProvider>
  );
});

const FamilyTreeInner = forwardRef<FamilyTreeHandle, FamilyTreeProps>(function FamilyTreeInner({ treeId }, ref) {
  const [nodes, setNodes, onNodesChange] = useNodesState<FamilyNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

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

  const loadTreeData = useCallback(async () => {
    try {
      const [persons, relationships] = await Promise.all([
        personApi.list(treeId),
        relationshipApi.list(treeId),
      ]);

      const flowNodes = persons.map(personToNode);
      const flowEdges = relationships.map(relationshipToEdge);

      flowNodes.forEach((node) => {
        const data = node.data as FamilyNodeData;
        data.generation = computeGeneration(node.id, flowEdges, flowNodes);
      });

      const layouted = getLayoutedElements(flowNodes, flowEdges);
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
    } catch (err) {
      console.error("Failed to load tree data:", err);
    } finally {
      setLoading(false);
    }
  }, [treeId, setNodes, setEdges]);

  useEffect(() => {
    loadTreeData();
  }, [loadTreeData]);

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
      const gedcom = toGedcom(nodes as Node<FamilyNodeData>[], edges);
      const blob = new Blob([gedcom], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "family-tree.ged";
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
        personApi.delete(treeId, contextMenu.nodeId).catch(console.error);
        const edgesToDelete = edges.filter(
          (e) => e.source === contextMenu.nodeId || e.target === contextMenu.nodeId,
        );
        Promise.all(edgesToDelete.map((e) => relationshipApi.delete(treeId, e.id))).catch(console.error);
        const newNodes = nodes.filter((n) => n.id !== contextMenu.nodeId);
        const newEdges = edges.filter(
          (e) => e.source !== contextMenu.nodeId && e.target !== contextMenu.nodeId,
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
    [contextMenu, nodes, edges, relayout, treeId],
  );

  const handleDialogConfirm = useCallback(
    async (data: PersonFormData) => {
      if (!dialogState.open) return;

      const { action, targetId, targetData } = dialogState;
      const fullName = `${data.firstName} ${data.lastName}`;

      let newGeneration = targetData.generation;
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

      try {
        const createdPerson = await personApi.create(treeId, {
          first_name: data.firstName,
          last_name: data.lastName,
          gender: data.gender,
          date_of_birth: data.dateOfBirth,
          date_of_death: data.dateOfDeath,
          avatar_url: data.photo,
          metadata: { generation: newGeneration, notes: data.notes, relationshipType: data.relationshipType },
        });

        const newNode = personToNode(createdPerson);
        const newEdges: Edge[] = [];

        switch (action) {
          case "add":
            break;
          case "spouse": {
            const rel = await relationshipApi.create(treeId, {
              person_a_id: targetId,
              person_b_id: createdPerson.id,
              type: "spouse",
            });
            newEdges.push(relationshipToEdge(rel));
            break;
          }
          case "child": {
            const motherId = findMother(targetId, nodes, edges) ?? targetId;
            const rel = await relationshipApi.create(treeId, {
              person_a_id: motherId,
              person_b_id: createdPerson.id,
              type: "child",
            });
            newEdges.push(relationshipToEdge(rel));
            break;
          }
          case "parent": {
            const rel = await relationshipApi.create(treeId, {
              person_a_id: createdPerson.id,
              person_b_id: targetId,
              type: "parent",
            });
            newEdges.push(relationshipToEdge(rel));
            break;
          }
          case "sibling": {
            const parents = findParents(targetId, edges);
            for (const parentId of parents) {
              const rel = await relationshipApi.create(treeId, {
                person_a_id: parentId,
                person_b_id: createdPerson.id,
                type: "child",
              });
              newEdges.push(relationshipToEdge(rel));
            }
            break;
          }
        }

        const allNodes = [...nodes, newNode];
        const allEdges = [...edges, ...newEdges];
        setDialogState((prev) => ({ ...prev, open: false }));
        relayout(allNodes, allEdges);
      } catch (err) {
        console.error("Failed to create person:", err);
      }
    },
    [dialogState, nodes, edges, relayout, treeId],
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      type: ConnectionLineType.SmoothStep,
      style: { stroke: "#8C8782", strokeWidth: 1.5 },
    }),
    [],
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[#8C8782]">
        Loading tree...
      </div>
    );
  }

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
