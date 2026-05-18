import { useNodes, useEdges, type EdgeProps, type Edge, type Node } from '@xyflow/react';
import { useMemo } from 'react';

const NODE_WIDTH = 172;

const REL_STYLES: Record<string, { stroke: string; strokeWidth: number; dashArray?: string }> = {
  spouse: { stroke: '#7D6B3D', strokeWidth: 2 },
  parent: { stroke: '#5E5954', strokeWidth: 1.5 },
  child: { stroke: '#5E5954', strokeWidth: 1.5 },
  adopted: { stroke: '#2563EB', strokeWidth: 1.5, dashArray: '6 3' },
  'adopted-parent': { stroke: '#2563EB', strokeWidth: 1.5, dashArray: '6 3' },
  'step-parent': { stroke: '#9333EA', strokeWidth: 1.5, dashArray: '4 4' },
  'step-child': { stroke: '#9333EA', strokeWidth: 1.5, dashArray: '4 4' },
  sibling: { stroke: '#16A34A', strokeWidth: 1.5, dashArray: '8 4' },
  'half-sibling': { stroke: '#D97706', strokeWidth: 1.5, dashArray: '2 4' },
};

function findSpouse(nodeId: string, allEdges: Edge[]): string | null {
  const edge = allEdges.find(
    (e) => e.label === 'spouse' && (e.source === nodeId || e.target === nodeId),
  );
  if (!edge) return null;
  return edge.source === nodeId ? edge.target : edge.source;
}

function nodeCenterX(node: Node): number {
  return node.position.x + NODE_WIDTH / 2;
}

export function FamilyEdge({
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  label,
}: EdgeProps) {
  const nodes = useNodes();
  const edges = useEdges();

  const path = useMemo(() => {
    if (label === 'spouse') {
      return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    }

    const spouseId = findSpouse(source, edges);
    if (!spouseId) return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;

    const spouseNode = nodes.find((n) => n.id === spouseId);
    const sourceNode = nodes.find((n) => n.id === source);
    if (!spouseNode || !sourceNode) return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;

    const midX = (nodeCenterX(sourceNode) + nodeCenterX(spouseNode)) / 2;

    return `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`;
  }, [source, target, sourceX, sourceY, targetX, targetY, label, nodes, edges]);

  const relType = (label as string) || 'child';
  const style = REL_STYLES[relType] || REL_STYLES.child;

  return (
    <path
      d={path}
      stroke={style.stroke}
      strokeWidth={style.strokeWidth}
      strokeDasharray={style.dashArray}
      fill="none"
      className="react-flow__edge-path"
    />
  );
}
