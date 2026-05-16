import { useNodes, useEdges, type EdgeProps, type Edge, type Node } from '@xyflow/react';
import { useMemo } from 'react';

const NODE_WIDTH = 172;

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

  const strokeColor = label === 'spouse' ? '#7D6B3D' : '#8C8782';
  const strokeWidth = label === 'spouse' ? 2 : 1.5;

  return (
    <path
      d={path}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      fill="none"
      className="react-flow__edge-path"
    />
  );
}
