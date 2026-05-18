import dagre from '@dagrejs/dagre';
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
} from '@xyflow/react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import '@xyflow/react/dist/style.css';

import { useNavigate } from '@tanstack/react-router';
import { useHistory, type HistoryEntry } from '@/hooks/use-history';
import { personApi, relationshipApi, type Person, type Relationship } from '@/lib/api';

import { AddPersonDialog, type PersonFormData } from './add-person-dialog';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { EditPersonDialog } from './edit-person-dialog';
import FamilyTreeNode from './family-tree-node';
import type { FamilyNodeData } from './family-tree-node';
import { NodeContextMenu, type ContextMenuAction } from './node-context-menu';

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 64;

const nodeTypes: NodeTypes = {
  family: FamilyTreeNode,
};

type LayoutMode = 'TB' | 'LR' | 'FREE';

function getLayoutedElements(
  nodes: Node<FamilyNodeData>[],
  edges: Edge[],
  direction: LayoutMode = 'TB',
) {
  if (direction === 'FREE') {
    return { nodes, edges };
  }

  const isHorizontal = direction === 'LR';

  const spouseEdges = edges.filter((e) => e.label === 'spouse');

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

  const newEdges = edges.map((edge) => {
    if (isHorizontal) {
      if (edge.label === 'spouse') {
        return { ...edge, sourceHandle: 'bottom', targetHandle: 'top' };
      }
      return { ...edge, sourceHandle: 'right', targetHandle: 'left' };
    }
    if (edge.label === 'spouse') {
      return { ...edge, sourceHandle: 'right', targetHandle: 'left' };
    }
    return { ...edge, sourceHandle: 'bottom', targetHandle: 'top' };
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

  return { nodes: newNodes, edges: newEdges };
}

function personToNode(p: Person): Node<FamilyNodeData> {
  const gen = ((p.metadata as Record<string, unknown>)?.generation as number) ?? 0;
  return {
    id: p.id,
    type: 'family',
    position: { x: 0, y: 0 },
    data: {
      label: `${p.first_name} ${p.last_name}`.trim(),
      firstName: p.first_name,
      lastName: p.last_name,
      gender: (p.gender as FamilyNodeData['gender']) || undefined,
      generation: gen,
      dateOfBirth: p.date_of_birth || undefined,
      dateOfDeath: p.date_of_death || undefined,
      photo: p.avatar_url || undefined,
      subtitle: p.date_of_birth
        ? `${p.date_of_birth}${p.date_of_death ? `-${p.date_of_death}` : ''}`
        : undefined,
    },
  };
}

function relationshipToEdge(r: Relationship): Edge {
  const isSpouse = r.type === 'spouse';
  return {
    id: r.id,
    source: r.person_a_id,
    target: r.person_b_id,
    sourceHandle: isSpouse ? 'right' : 'bottom',
    targetHandle: isSpouse ? 'left' : 'top',
    type: isSpouse ? 'straight' : 'smoothstep',
    style: isSpouse ? { stroke: '#7D6B3D' } : { stroke: '#8C8782', strokeWidth: 1.5 },
    label: isSpouse ? 'spouse' : undefined,
  };
}

function computeGeneration(personId: string, edges: Edge[], nodes: Node<FamilyNodeData>[]): number {
  const visited = new Set<string>();
  function depth(id: string): number {
    if (visited.has(id)) return 0;
    visited.add(id);
    const parents = edges.filter((e) => e.target === id && e.type === 'smoothstep');
    if (parents.length === 0) return 0;
    return 1 + Math.max(...parents.map((e) => depth(e.source)));
  }
  return depth(personId);
}

function findParents(nodeId: string, allEdges: Edge[]): string[] {
  return allEdges
    .filter((e) => e.target === nodeId && e.type === 'smoothstep')
    .map((e) => e.source);
}

function findSpouse(nodeId: string, allEdges: Edge[]): string | null {
  const spouseEdge = allEdges.find(
    (e) => e.label === 'spouse' && (e.source === nodeId || e.target === nodeId),
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
  if (data.gender === 'female') return targetId;
  const spouseId = findSpouse(targetId, allEdges);
  if (!spouseId) return null;
  const spouse = allNodes.find((n) => n.id === spouseId);
  if (!spouse) return null;
  const spouseData = spouse.data as unknown as FamilyNodeData;
  return spouseData.gender === 'female' ? spouseId : null;
}

function getFreeFormPosition(
  targetId: string,
  action: ContextMenuAction,
  nodes: Node<FamilyNodeData>[],
): { x: number; y: number } {
  const targetNode = nodes.find((n) => n.id === targetId);
  if (!targetNode) return { x: 200, y: 200 };
  const spacing = 60;
  switch (action) {
    case 'child':
      return { x: targetNode.position.x, y: targetNode.position.y + nodeHeight + spacing };
    case 'spouse':
      return { x: targetNode.position.x + nodeWidth + spacing, y: targetNode.position.y };
    case 'parent':
      return { x: targetNode.position.x, y: targetNode.position.y - nodeHeight - spacing };
    case 'sibling':
      return { x: targetNode.position.x + nodeWidth + spacing, y: targetNode.position.y };
    default:
      return { x: targetNode.position.x, y: targetNode.position.y + nodeHeight + spacing };
  }
}

const GEDCOM_MONTHS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

function toGedcomDate(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;
  const parts = dateStr.split('-');
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
  lines.push('0 HEAD');
  lines.push('1 SOUR Belong');
  lines.push('2 NAME Belong Family Tree');
  lines.push('1 CHAR UTF-8');
  lines.push('1 GEDC');
  lines.push('2 VERS 5.5.1');
  lines.push('2 FORM LINEAGE-LINKED');

  const idToXref: Record<string, string> = {};

  nodes.forEach((node, i) => {
    const xref = `I${i + 1}`;
    idToXref[node.id] = xref;
    const data = node.data as unknown as FamilyNodeData;
    const sex = data.gender === 'female' ? 'F' : data.gender === 'male' ? 'M' : undefined;

    lines.push(`0 @${xref}@ INDI`);
    const lastName = data.lastName || '';
    const firstName = data.firstName || data.label.replace(` ${lastName}`, '');
    lines.push(`1 NAME ${firstName} /${lastName}/`);
    if (sex) lines.push(`1 SEX ${sex}`);

    const birthDate = toGedcomDate(data.dateOfBirth);
    if (birthDate) {
      lines.push('1 BIRT');
      lines.push(`2 DATE ${birthDate}`);
    }
    const deathDate = toGedcomDate(data.dateOfDeath);
    if (deathDate) {
      lines.push('1 DEAT');
      lines.push(`2 DATE ${deathDate}`);
    }
  });

  let familyCount = 0;
  const visited = new Set<string>();

  const spouseEdges = edges.filter((e) => e.label === 'spouse');
  for (const edge of spouseEdges) {
    const key = [edge.source, edge.target].sort().join('-');
    if (visited.has(key)) continue;
    visited.add(key);

    const husbXref = idToXref[edge.source];
    const wifeXref = idToXref[edge.target];
    const husbNode = nodes.find((n) => n.id === edge.source);
    const husbGender = (husbNode?.data as unknown as FamilyNodeData)?.gender;

    familyCount++;
    const famXref = `F${familyCount}`;
    lines.push(`0 @${famXref}@ FAM`);

    if (husbGender === 'male') {
      lines.push(`1 HUSB @${husbXref}@`);
      lines.push(`1 WIFE @${wifeXref}@`);
    } else {
      lines.push(`1 HUSB @${wifeXref}@`);
      lines.push(`1 WIFE @${husbXref}@`);
    }

    const children = edges.filter(
      (e) => e.type === 'smoothstep' && (e.source === edge.source || e.source === edge.target),
    );
    for (const child of children) {
      const childXref = idToXref[child.target];
      if (childXref) lines.push(`1 CHIL @${childXref}@`);
    }
  }

  const parentOnly = edges.filter(
    (e) =>
      e.type === 'smoothstep' &&
      !spouseEdges.some((s) => s.source === e.source || s.target === e.source),
  );

  for (const edge of parentOnly) {
    const childXref = idToXref[edge.target];
    if (!childXref) continue;
    familyCount++;
    const famXref = `F${familyCount}`;
    lines.push(`0 @${famXref}@ FAM`);
    lines.push(`1 CHIL @${childXref}@`);
  }

  lines.push('0 TRLR');
  return lines.join('\n');
}

export type FamilyTreeHandle = { addMember: () => void; exportTree: () => void };
type FamilyTreeProps = { treeId: string };

export const FamilyTree = forwardRef<FamilyTreeHandle, FamilyTreeProps>(function FamilyTree(
  { treeId },
  ref,
) {
  return (
    <ReactFlowProvider>
      <FamilyTreeInner ref={ref} treeId={treeId} />
    </ReactFlowProvider>
  );
});

const FamilyTreeInner = forwardRef<FamilyTreeHandle, FamilyTreeProps>(function FamilyTreeInner(
  { treeId },
  ref,
) {
  const [nodes, setNodes, onNodesChange] = useNodesState<FamilyNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('TB');

  const navigate = useNavigate();

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
    action: 'spouse',
    targetId: '',
    targetData: { label: '', generation: 0 },
  });

  const [editState, setEditState] = useState<{
    open: boolean;
    personId: string;
    personData: FamilyNodeData;
  }>({
    open: false,
    personId: '',
    personData: { label: '', generation: 0 },
  });

  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    nodeId: string;
    nodeData: FamilyNodeData;
    relCount: number;
  }>({
    open: false,
    nodeId: '',
    nodeData: { label: '', generation: 0 },
    relCount: 0,
  });

  const recreatedIdsRef = useRef<Map<string, string>>(new Map());

  const history = useHistory();

  const stats = useMemo(() => {
    const memberCount = nodes.length;
    const living = nodes.filter((n) => {
      const s = (n.data as unknown as FamilyNodeData).subtitle;
      return !s || !/^\d{4}-\d{4}$/.test(s);
    }).length;
    const generations = new Set(nodes.map((n) => (n.data as unknown as FamilyNodeData).generation))
      .size;
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

      const layouted = getLayoutedElements(flowNodes, flowEdges, layoutMode);
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
    } catch (err) {
      console.error('Failed to load tree data:', err);
    } finally {
      setLoading(false);
    }
  }, [treeId, setNodes, setEdges, layoutMode]);

  useEffect(() => {
    loadTreeData();
  }, [loadTreeData]);

  const { fitView, zoomIn, zoomOut } = useReactFlow();

  useImperativeHandle(ref, () => ({
    addMember: () => {
      setDialogState({
        open: true,
        action: 'add',
        targetId: '',
        targetData: { label: '', generation: 0 },
      });
    },
    exportTree: () => {
      const gedcom = toGedcom(nodes as Node<FamilyNodeData>[], edges);
      const blob = new Blob([gedcom], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'family-tree.ged';
      a.click();
      URL.revokeObjectURL(url);
    },
  }));

  const relayout = useCallback(
    (newNodes: Node<FamilyNodeData>[], newEdges: Edge[], mode?: LayoutMode) => {
      const m = mode ?? layoutMode;
      if (m === 'FREE') {
        setNodes(newNodes);
        setEdges(newEdges);
        return;
      }
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        newNodes,
        newEdges,
        m,
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    },
    [layoutMode, setNodes, setEdges],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge({ ...params, type: ConnectionLineType.SmoothStep, animated: true }, eds),
      );
    },
    [setEdges],
  );

  const onNodeClick = useCallback<NodeMouseHandler>((_, node) => {
    navigate({ to: '/person/$id', params: { id: node.id } });
  }, [navigate]);

  const onNodeContextMenu = useCallback<NodeMouseHandler>((event, node) => {
    event.preventDefault();
    const nodeData = node.data as unknown as FamilyNodeData;
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
      nodeData,
    });
  }, []);

  const onLayout = useCallback(
    (mode: LayoutMode) => {
      setLayoutMode(mode);
      if (mode === 'FREE') return;
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodes as Node<FamilyNodeData>[],
        edges,
        mode,
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    },
    [nodes, edges, setNodes, setEdges],
  );

  const handleContextMenuAction = useCallback(
    (action: ContextMenuAction) => {
      if (!contextMenu) return;
      if (action === 'view') {
        navigate({ to: '/person/$id', params: { id: contextMenu.nodeId } });
        return;
      }
      if (action === 'delete') {
        const relCount = edges.filter(
          (e) => e.source === contextMenu.nodeId || e.target === contextMenu.nodeId,
        ).length;
        setDeleteState({
          open: true,
          nodeId: contextMenu.nodeId,
          nodeData: contextMenu.nodeData,
          relCount,
        });
        return;
      }
      if (action === 'edit') {
        setEditState({
          open: true,
          personId: contextMenu.nodeId,
          personData: contextMenu.nodeData,
        });
        return;
      }
      setDialogState({
        open: true,
        action,
        targetId: contextMenu.nodeId,
        targetData: contextMenu.nodeData,
      });
    },
    [contextMenu, edges],
  );

  const handleDeleteConfirm = useCallback(async () => {
    const { nodeId, nodeData } = deleteState;
    if (!nodeId) return;

    const personRels = await relationshipApi.list(treeId);
    const relsToDelete = personRels.filter(
      (r) => r.person_a_id === nodeId || r.person_b_id === nodeId,
    );

    const oldPersonData: Partial<Person> = {
      first_name: nodeData.firstName || '',
      last_name: nodeData.lastName || '',
      gender: nodeData.gender || '',
      date_of_birth: nodeData.dateOfBirth || '',
      date_of_death: nodeData.dateOfDeath || '',
      avatar_url: nodeData.photo || '',
      metadata: { generation: nodeData.generation, notes: nodeData.notes },
    };

    const oldRels = relsToDelete.map((r) => ({
      person_a_id: r.person_a_id,
      person_b_id: r.person_b_id,
      type: r.type,
      metadata: r.metadata,
    }));

    const entry: HistoryEntry = {
      description: `Delete ${nodeData.label}`,
      undo: async () => {
        const person = await personApi.create(treeId, oldPersonData);
        recreatedIdsRef.current.set(nodeId, person.id);
        for (const rel of oldRels) {
          await relationshipApi.create(treeId, {
            person_a_id: rel.person_a_id === nodeId ? person.id : rel.person_a_id,
            person_b_id: rel.person_b_id === nodeId ? person.id : rel.person_b_id,
            type: rel.type,
            metadata: rel.metadata as Record<string, unknown>,
          });
        }
      },
      redo: async () => {
        const currentId = recreatedIdsRef.current.get(nodeId) ?? nodeId;
        await personApi.delete(treeId, currentId);
        const currentRels = await relationshipApi.list(treeId);
        const toDelete = currentRels.filter(
          (r) => r.person_a_id === currentId || r.person_b_id === currentId,
        );
        for (const r of toDelete) {
          await relationshipApi.delete(treeId, r.id);
        }
      },
    };

    try {
      await personApi.delete(treeId, nodeId);
      for (const r of relsToDelete) {
        await relationshipApi.delete(treeId, r.id);
      }
      history.push(entry);
      const newNodes = nodes.filter((n) => n.id !== nodeId);
      const newEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
      relayout(newNodes, newEdges);
    } catch (err) {
      console.error('Failed to delete person:', err);
    }

    setDeleteState((prev) => ({ ...prev, open: false }));
  }, [deleteState, treeId, nodes, edges, relayout, history]);

  const handleEditConfirm = useCallback(
    async (data: PersonFormData) => {
      const { personId, personData: oldNodeData } = editState;
      if (!personId) return;

      const newApiData = {
        first_name: data.firstName,
        last_name: data.lastName,
        gender: data.gender,
        date_of_birth: data.dateOfBirth || '',
        date_of_death: data.dateOfDeath || '',
        avatar_url: data.photo || '',
        metadata: {
          generation: oldNodeData.generation,
          notes: data.notes,
          relationshipType: data.relationshipType,
        },
      };

      const oldApiData = {
        first_name: oldNodeData.firstName || '',
        last_name: oldNodeData.lastName || '',
        gender: oldNodeData.gender || '',
        date_of_birth: oldNodeData.dateOfBirth || '',
        date_of_death: oldNodeData.dateOfDeath || '',
        avatar_url: oldNodeData.photo || '',
        metadata: {
          generation: oldNodeData.generation,
          notes: oldNodeData.notes,
          relationshipType: oldNodeData.relationshipType,
        },
      };

      const entry: HistoryEntry = {
        description: `Edit ${oldNodeData.label}`,
        undo: async () => {
          await personApi.update(treeId, personId, oldApiData);
        },
        redo: async () => {
          await personApi.update(treeId, personId, newApiData);
        },
      };

      try {
        await personApi.update(treeId, personId, newApiData);
        history.push(entry);

        const updatedNode = nodes.find((n) => n.id === personId);
        if (updatedNode) {
          const newLabel = `${data.firstName} ${data.lastName}`.trim();
          const updatedNodes = nodes.map((n) => {
            if (n.id !== personId) return n;
            return {
              ...n,
              data: {
                ...n.data,
                label: newLabel,
                firstName: data.firstName,
                lastName: data.lastName,
                gender: data.gender,
                dateOfBirth: data.dateOfBirth,
                dateOfDeath: data.dateOfDeath,
                photo: data.photo,
                notes: data.notes,
                relationshipType: data.relationshipType,
                subtitle: data.dateOfBirth
                  ? `${data.dateOfBirth}${data.dateOfDeath ? `-${data.dateOfDeath}` : ''}`
                  : undefined,
              } as FamilyNodeData,
            };
          });
          relayout(updatedNodes, edges);
        }
      } catch (err) {
        console.error('Failed to update person:', err);
      }

      setEditState((prev) => ({ ...prev, open: false }));
    },
    [editState, treeId, nodes, edges, relayout, history],
  );

  const handleDialogConfirm = useCallback(
    async (data: PersonFormData) => {
      if (!dialogState.open) return;

      const { action, targetId, targetData } = dialogState;
      const fullName = `${data.firstName} ${data.lastName}`;

      let newGeneration = targetData.generation;
      switch (action) {
        case 'add':
          newGeneration = 0;
          break;
        case 'spouse':
        case 'sibling':
          break;
        case 'child':
          newGeneration = targetData.generation + 1;
          break;
        case 'parent':
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
          metadata: {
            generation: newGeneration,
            notes: data.notes,
            relationshipType: data.relationshipType,
          },
        });

        const newNode = personToNode(createdPerson);

        if (layoutMode === 'FREE' && targetId) {
          const pos = getFreeFormPosition(targetId, action, nodes as Node<FamilyNodeData>[]);
          newNode.position = pos;
        }

        const newEdges: Edge[] = [];

        switch (action) {
          case 'add':
            break;
          case 'spouse': {
            const rel = await relationshipApi.create(treeId, {
              person_a_id: targetId,
              person_b_id: createdPerson.id,
              type: 'spouse',
            });
            newEdges.push(relationshipToEdge(rel));
            break;
          }
          case 'child': {
            const motherId = findMother(targetId, nodes, edges) ?? targetId;
            const rel = await relationshipApi.create(treeId, {
              person_a_id: motherId,
              person_b_id: createdPerson.id,
              type: 'child',
            });
            newEdges.push(relationshipToEdge(rel));
            break;
          }
          case 'parent': {
            const rel = await relationshipApi.create(treeId, {
              person_a_id: createdPerson.id,
              person_b_id: targetId,
              type: 'parent',
            });
            newEdges.push(relationshipToEdge(rel));
            break;
          }
          case 'sibling': {
            const parents = findParents(targetId, edges);
            for (const parentId of parents) {
              const rel = await relationshipApi.create(treeId, {
                person_a_id: parentId,
                person_b_id: createdPerson.id,
                type: 'child',
              });
              newEdges.push(relationshipToEdge(rel));
            }
            break;
          }
        }

        const personApiData = {
          first_name: data.firstName,
          last_name: data.lastName,
          gender: data.gender,
          date_of_birth: data.dateOfBirth || '',
          date_of_death: data.dateOfDeath || '',
          avatar_url: data.photo || '',
          metadata: {
            generation: newGeneration,
            notes: data.notes,
            relationshipType: data.relationshipType,
          },
        };

        const relApiData = newEdges.map((e) => ({
          person_a_id: e.source,
          person_b_id: e.target,
          type: e.label === 'spouse' ? 'spouse' : 'child',
        }));

        const entry: HistoryEntry = {
          description: `Add ${fullName}`,
          undo: async () => {
            const currentId = recreatedIdsRef.current.get(createdPerson.id) ?? createdPerson.id;
            const rels = await relationshipApi.list(treeId);
            const toDelete = rels.filter(
              (r) => r.person_a_id === currentId || r.person_b_id === currentId,
            );
            for (const r of toDelete) {
              await relationshipApi.delete(treeId, r.id);
            }
            await personApi.delete(treeId, currentId);
          },
          redo: async () => {
            const person = await personApi.create(treeId, personApiData);
            recreatedIdsRef.current.set(createdPerson.id, person.id);
            for (const rd of relApiData) {
              await relationshipApi.create(treeId, {
                ...rd,
                person_a_id: rd.person_a_id === createdPerson.id ? person.id : rd.person_a_id,
                person_b_id: rd.person_b_id === createdPerson.id ? person.id : rd.person_b_id,
              });
            }
          },
        };

        history.push(entry);

        const allNodes = [...nodes, newNode];
        const allEdges = [...edges, ...newEdges];
        setDialogState((prev) => ({ ...prev, open: false }));
        relayout(allNodes, allEdges);
      } catch (err) {
        console.error('Failed to create person:', err);
      }
    },
    [dialogState, nodes, edges, relayout, treeId, layoutMode, history],
  );

  const handleUndo = useCallback(async () => {
    await history.undo();
    await loadTreeData();
  }, [history.undo, loadTreeData]);

  const handleRedo = useCallback(async () => {
    await history.redo();
    await loadTreeData();
  }, [history.redo, loadTreeData]);

  const handleUndoRef = useRef(handleUndo);
  handleUndoRef.current = handleUndo;
  const handleRedoRef = useRef(handleRedo);
  handleRedoRef.current = handleRedo;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedoRef.current();
        } else {
          handleUndoRef.current();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const defaultEdgeOptions = useMemo(
    () => ({
      type: ConnectionLineType.SmoothStep,
      style: { stroke: '#8C8782', strokeWidth: 1.5 },
    }),
    [],
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[#8C8782]">Loading tree...</div>
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
            onClick={handleUndo}
            disabled={!history.canUndo}
            className="rounded-lg border border-[#D6D0BE] bg-[#F5F2E9] px-2.5 py-1.5 text-xs font-medium text-[#2D2926] hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            title="Undo (Ctrl+Z)"
          >
            Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={!history.canRedo}
            className="rounded-lg border border-[#D6D0BE] bg-[#F5F2E9] px-2.5 py-1.5 text-xs font-medium text-[#2D2926] hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            title="Redo (Ctrl+Shift+Z)"
          >
            Redo
          </button>
          <div className="w-px bg-[#D6D0BE]" />
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
            onClick={() => onLayout('TB')}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              layoutMode === 'TB'
                ? 'border-[#7D6B3D] bg-white text-[#7D6B3D]'
                : 'border-[#D6D0BE] bg-[#F5F2E9] text-[#2D2926] hover:bg-white'
            }`}
          >
            Vertical
          </button>
          <button
            onClick={() => onLayout('LR')}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              layoutMode === 'LR'
                ? 'border-[#7D6B3D] bg-white text-[#7D6B3D]'
                : 'border-[#D6D0BE] bg-[#F5F2E9] text-[#2D2926] hover:bg-white'
            }`}
          >
            Horizontal
          </button>
          <button
            onClick={() => onLayout('FREE')}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              layoutMode === 'FREE'
                ? 'border-[#7D6B3D] bg-white text-[#7D6B3D]'
                : 'border-[#D6D0BE] bg-[#F5F2E9] text-[#2D2926] hover:bg-white'
            }`}
          >
            Free
          </button>
        </Panel>
        <Panel
          position="bottom-left"
          className="rounded-lg border border-[#D6D0BE] bg-[#F5F2E9]/90 px-3 py-2 text-xs text-[#2D2926] shadow-sm backdrop-blur-sm"
        >
          <div className="flex gap-4">
            <span>
              <strong>{stats.memberCount}</strong> members
            </span>
            <span>
              <strong>{stats.living}</strong> living
            </span>
            <span>
              <strong>{stats.generations}</strong> generations
            </span>
            <span className="text-[#8C8782]">updated today</span>
          </div>
        </Panel>
        <Background gap={20} size={1} color="#D6D0BE" />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(n) => {
            const d = n.data as FamilyNodeData;
            return d?.gender === 'female' ? '#A0866D' : '#7D6B3D';
          }}
          maskColor="rgba(0,0,0,0.1)"
          style={{ background: '#F5F2E9', border: '1px solid #D6D0BE', borderRadius: 8 }}
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
        onOpenChange={(open) => setDialogState((prev) => ({ ...prev, open }))}
        action={dialogState.action}
        onConfirm={handleDialogConfirm}
      />

      <EditPersonDialog
        open={editState.open}
        onOpenChange={(open) => setEditState((prev) => ({ ...prev, open }))}
        personData={editState.personData}
        onConfirm={handleEditConfirm}
      />

      <DeleteConfirmDialog
        open={deleteState.open}
        onOpenChange={(open) => setDeleteState((prev) => ({ ...prev, open }))}
        personName={deleteState.nodeData.label}
        relationshipCount={deleteState.relCount}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
});
