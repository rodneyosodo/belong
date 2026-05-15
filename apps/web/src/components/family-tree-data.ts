import type { Node, Edge } from "@xyflow/react";
import type { FamilyNodeData } from "./family-tree-node";

export const initialNodes: Node<FamilyNodeData>[] = [
  {
    id: "1",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "Elias Anderson", firstName: "Elias", lastName: "Anderson", subtitle: "1935-2010", gender: "male", generation: 0, dateOfBirth: "1935", dateOfDeath: "2010" },
  },
  {
    id: "2",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "Clara Anderson", firstName: "Clara", lastName: "Anderson", subtitle: "1938-2015", gender: "female", generation: 0, dateOfBirth: "1938", dateOfDeath: "2015" },
  },
  {
    id: "3",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "Henry Anderson", firstName: "Henry", lastName: "Anderson", subtitle: "1960", gender: "male", generation: 1, dateOfBirth: "1960" },
  },
  {
    id: "4",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "Margaret Anderson", firstName: "Margaret", lastName: "Anderson", subtitle: "1963", gender: "female", generation: 1, dateOfBirth: "1963" },
  },
  {
    id: "5",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "Thomas Anderson", firstName: "Thomas", lastName: "Anderson", subtitle: "1965", gender: "male", generation: 1, dateOfBirth: "1965" },
  },
  {
    id: "6",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "Rebecca Anderson", firstName: "Rebecca", lastName: "Anderson", subtitle: "1968", gender: "female", generation: 1, dateOfBirth: "1968" },
  },
  {
    id: "7",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "James Anderson", firstName: "James", lastName: "Anderson", subtitle: "1985", gender: "male", generation: 2, dateOfBirth: "1985" },
  },
  {
    id: "8",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "Sarah Anderson", firstName: "Sarah", lastName: "Anderson", subtitle: "1987", gender: "female", generation: 2, dateOfBirth: "1987" },
  },
  {
    id: "9",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "Noah Anderson", firstName: "Noah", lastName: "Anderson", subtitle: "1990", gender: "male", generation: 2, dateOfBirth: "1990" },
  },
  {
    id: "10",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "Olivia Anderson", firstName: "Olivia", lastName: "Anderson", subtitle: "1992", gender: "female", generation: 2, dateOfBirth: "1992" },
  },
  {
    id: "11",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "Emily Anderson", firstName: "Emily", lastName: "Anderson", subtitle: "2010", gender: "female", generation: 3, dateOfBirth: "2010" },
  },
  {
    id: "12",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "Michael Anderson", firstName: "Michael", lastName: "Anderson", subtitle: "2012", gender: "male", generation: 3, dateOfBirth: "2012" },
  },
  {
    id: "13",
    type: "family",
    position: { x: 0, y: 0 },
    data: { label: "Lily Anderson", firstName: "Lily", lastName: "Anderson", subtitle: "2015", gender: "female", generation: 3, dateOfBirth: "2015" },
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
