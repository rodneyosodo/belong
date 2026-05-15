import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export type FamilyNodeData = {
  label: string;
  subtitle?: string;
  gender?: "male" | "female";
  generation: number;
  photo?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  dateOfDeath?: string;
  notes?: string;
  relationshipType?: string;
};

const genderStyles: Record<string, { border: string; bg: string; accent: string; text: string; subtitle: string }> = {
  male: {
    border: "border-[#7D6B3D]",
    bg: "bg-[#F5F2E9]",
    accent: "bg-[#7D6B3D]",
    text: "text-[#2D2926]",
    subtitle: "text-[#8C8782]",
  },
  female: {
    border: "border-[#A0866D]",
    bg: "bg-[#EDEAD8]",
    accent: "bg-[#A0866D]",
    text: "text-[#2D2926]",
    subtitle: "text-[#8C8782]",
  },
};

function FamilyTreeNode({ data }: NodeProps) {
  const nodeData = data as unknown as FamilyNodeData;
  const gender = nodeData.gender ?? "male";
  const style = genderStyles[gender];
  const displayName = nodeData.label;
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const dates = nodeData.dateOfBirth
    ? `${nodeData.dateOfBirth}${nodeData.dateOfDeath ? `-${nodeData.dateOfDeath}` : ""}`
    : nodeData.subtitle;

  return (
    <div
      className={`rounded-xl border-2 ${style.border} ${style.bg} px-4 py-2.5 shadow-sm min-w-[160px]`}
    >
      <Handle type="target" position={Position.Top} id="top" className="!bg-[#7D6B3D]" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-transparent !border-0" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-transparent !border-0" />
      <div className="flex items-center gap-3">
        {nodeData.photo ? (
          <img
            src={nodeData.photo}
            alt=""
            className="size-9 rounded-full object-cover border border-[#D6D0BE] shrink-0"
          />
        ) : (
          <div
            className={`size-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${style.accent} text-white`}
          >
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className={`text-sm font-semibold leading-tight truncate ${style.text}`}>
            {displayName}
          </p>
          {dates && (
            <p className={`text-[11px] ${style.subtitle}`}>{dates}</p>
          )}
          <p className={`text-[10px] uppercase tracking-wider ${style.subtitle}`}>
            {gender === "male" ? "\u2642 Male" : "\u2640 Female"}
          </p>
          {nodeData.relationshipType && (
            <p className={`text-[10px] ${style.subtitle}`}>{nodeData.relationshipType}</p>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!bg-[#7D6B3D]"
      />
    </div>
  );
}

export default memo(FamilyTreeNode);
