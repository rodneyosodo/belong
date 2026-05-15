import type { Node, Edge } from "@xyflow/react";
import type { FamilyNodeData } from "./family-tree-node";

export const initialNodes: Node<FamilyNodeData>[] = [
  {
    id: "1",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "Elias Anderson", subtitle: "1935-2010", gender: "male", generation: 0 },
  },
  {
    id: "2",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "Clara Anderson", subtitle: "1938-2015", gender: "female", generation: 0 },
  },
  {
    id: "3",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "Henry Anderson", subtitle: "1960", gender: "male", generation: 1 },
  },
  {
    id: "4",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "Margaret Anderson", subtitle: "1963", gender: "female", generation: 1 },
  },
  {
    id: "5",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "Thomas Anderson", subtitle: "1965", gender: "male", generation: 1 },
  },
  {
    id: "6",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "Rebecca Anderson", subtitle: "1968", gender: "female", generation: 1 },
  },
  {
    id: "7",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "James Anderson", subtitle: "1985", gender: "male", generation: 2 },
  },
  {
    id: "8",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "Sarah Anderson", subtitle: "1987", gender: "female", generation: 2 },
  },
  {
    id: "9",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "Noah Anderson", subtitle: "1990", gender: "male", generation: 2 },
  },
  {
    id: "10",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "Olivia Anderson", subtitle: "1992", gender: "female", generation: 2 },
  },
  {
    id: "11",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "Emily Anderson", subtitle: "2010", gender: "female", generation: 3 },
  },
  {
    id: "12",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "Michael Anderson", subtitle: "2012", gender: "male", generation: 3 },
  },
  {
    id: "13",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "Lily Anderson", subtitle: "2015", gender: "female", generation: 3 },
  },
];

export const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", sourceHandle: "right", targetHandle: "left", type: "straight", animated: false, style: { stroke: "#7D6B3D" }, label: "spouse" },
  { id: "e3-4", source: "3", target: "4", sourceHandle: "right", targetHandle: "left", type: "straight", animated: false, style: { stroke: "#7D6B3D" }, label: "spouse" },
  { id: "e5-6", source: "5", target: "6", sourceHandle: "right", targetHandle: "left", type: "straight", animated: false, style: { stroke: "#7D6B3D" }, label: "spouse" },
  { id: "e2-3", source: "2", target: "3", sourceHandle: "bottom", targetHandle: "top", type: "smoothstep", animated: false, style: { stroke: "#8C8782" } },
  { id: "e2-5", source: "2", target: "5", sourceHandle: "bottom", targetHandle: "top", type: "smoothstep", animated: false, style: { stroke: "#8C8782" } },
  { id: "e4-7", source: "4", target: "7", sourceHandle: "bottom", targetHandle: "top", type: "smoothstep", animated: false, style: { stroke: "#8C8782" } },
  { id: "e4-8", source: "4", target: "8", sourceHandle: "bottom", targetHandle: "top", type: "smoothstep", animated: false, style: { stroke: "#8C8782" } },
  { id: "e6-9", source: "6", target: "9", sourceHandle: "bottom", targetHandle: "top", type: "smoothstep", animated: false, style: { stroke: "#8C8782" } },
  { id: "e6-10", source: "6", target: "10", sourceHandle: "bottom", targetHandle: "top", type: "smoothstep", animated: false, style: { stroke: "#8C8782" } },
  { id: "e8-11", source: "8", target: "11", sourceHandle: "bottom", targetHandle: "top", type: "smoothstep", animated: false, style: { stroke: "#8C8782" } },
  { id: "e8-12", source: "8", target: "12", sourceHandle: "bottom", targetHandle: "top", type: "smoothstep", animated: false, style: { stroke: "#8C8782" } },
  { id: "e8-13", source: "8", target: "13", sourceHandle: "bottom", targetHandle: "top", type: "smoothstep", animated: false, style: { stroke: "#8C8782" } },
];
