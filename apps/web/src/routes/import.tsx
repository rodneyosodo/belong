import { useState, useRef, type ChangeEvent } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@workspace/ui/components/card"
import type { Node, Edge } from "@xyflow/react"
import type { FamilyNodeData } from "@/components/family-tree-node"

export const Route = createFileRoute("/import")({
  component: ImportPage,
})

const MONTHS: Record<string, string> = {
  JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
  JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
};

function normalizeDate(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;
  const parts = dateStr.split(" ");
  if (parts.length === 3) {
    const d = parts[0].padStart(2, "0");
    const m = MONTHS[parts[1].toUpperCase()];
    const y = parts[2];
    return m ? `${y}-${m}-${d}` : dateStr;
  }
  if (parts.length === 2 && MONTHS[parts[0].toUpperCase()]) {
    return `${parts[1]}-${MONTHS[parts[0].toUpperCase()]}`;
  }
  return dateStr;
}

function parseName(value: string): { firstName: string; lastName: string } {
  const m = value.match(/^(.+?)\s*\/(.+?)\//);
  if (m) {
    const first = m[1].trim();
    const last = m[2].trim();
    return { firstName: first || last, lastName: last || first };
  }
  const cleaned = value.replace(/\//g, "").trim();
  const i = cleaned.lastIndexOf(" ");
  return i > 0
    ? { firstName: cleaned.slice(0, i), lastName: cleaned.slice(i + 1) }
    : { firstName: cleaned, lastName: "" };
}

type GedLine = { level: number; xref?: string; tag: string; value?: string };

function tokenize(text: string): GedLine[] {
  return text.split("\n").filter(Boolean).map((line) => {
    const trimmed = line.trim();
    const parts = trimmed.split(" ");
    const level = Number(parts[0]);
    let idx = 1;
    let xref: string | undefined;
    if (parts[1]?.startsWith("@")) {
      xref = parts[1];
      idx = 2;
    }
    const tag = parts[idx] || "";
    const value = parts.slice(idx + 1).join(" ").trim() || undefined;
    return { level, xref, tag, value };
  });
}

function buildTree(lines: GedLine[]) {
  const root: any[] = [];
  const stack: { level: number; node: any }[] = [];

  for (const line of lines) {
    const node: any = { tag: line.tag, xref: line.xref, value: line.value, children: [] };
    while (stack.length > 0 && stack[stack.length - 1].level >= line.level) {
      stack.pop();
    }
    if (stack.length > 0) {
      stack[stack.length - 1].node.children.push(node);
    } else {
      root.push(node);
    }
    stack.push({ level: line.level, node });
  }
  return root;
}

function findChild(node: any, tag: string): any | undefined {
  return node.children?.find((c: any) => c.tag === tag);
}

function findChildValue(node: any, tag: string): string | undefined {
  return findChild(node, tag)?.value;
}

function getTagValues(node: any, tag: string): string[] {
  return node.children?.filter((c: any) => c.tag === tag).map((c: any) => c.value) || [];
}

function getAllValues(node: any, path: string[]): string | undefined {
  let current = node;
  for (const p of path) {
    current = findChild(current, p);
    if (!current) return undefined;
  }
  return current.value;
}

function parseGedcom(text: string): { nodes: Node<FamilyNodeData>[]; edges: Edge[] } {
  const lines = tokenize(text);
  const tree = buildTree(lines);

  const individuals: Record<string, any> = {};
  const families: Record<string, any> = {};

  for (const node of tree) {
    if (node.tag === "INDI" && node.xref) individuals[node.xref] = node;
    if (node.tag === "FAM" && node.xref) families[node.xref] = node;
  }

  let idCounter = 1;
  const idMap: Record<string, string> = {};
  const nodes: Node<FamilyNodeData>[] = [];
  const edges: Edge[] = [];

  function getId(xref: string): string {
    if (!idMap[xref]) idMap[xref] = String(idCounter++);
    return idMap[xref];
  }

  for (const [xref, node] of Object.entries(individuals)) {
    const nodeId = getId(xref);
    const nameVal = findChildValue(node, "NAME") || "Unknown";
    const { firstName, lastName } = parseName(nameVal);
    const sex = findChildValue(node, "SEX");
    const gender = sex === "F" ? "female" as const : sex === "M" ? "male" as const : undefined;
    const birthDate = normalizeDate(getAllValues(node, ["BIRT", "DATE"]));
    const deathDate = normalizeDate(getAllValues(node, ["DEAT", "DATE"]));
    const label = `${firstName} ${lastName}`.trim();

    nodes.push({
      id: nodeId,
      type: "family",
      position: { x: 0, y: 0 },
      data: { label, firstName, lastName, gender, generation: 0, dateOfBirth: birthDate, dateOfDeath: deathDate },
    });
  }

  for (const [, node] of Object.entries(families)) {
    const husb = findChildValue(node, "HUSB");
    const wife = findChildValue(node, "WIFE");
    const children = getTagValues(node, "CHIL");

    const husbId = husb ? getId(husb) : null;
    const wifeId = wife ? getId(wife) : null;

    if (husbId && wifeId) {
      edges.push({
        id: `e${husbId}-${wifeId}`,
        source: husbId,
        target: wifeId,
        sourceHandle: "right",
        targetHandle: "left",
        type: "straight",
        style: { stroke: "#7D6B3D" },
        label: "spouse",
      });
    }

    const motherId = wifeId || husbId;

    for (const childXref of children) {
      const childId = getId(childXref);
      if (motherId && childId) {
        edges.push({
          id: `e${motherId}-${childId}`,
          source: motherId,
          target: childId,
          sourceHandle: "bottom",
          targetHandle: "top",
          type: "smoothstep",
          style: { stroke: "#8C8782", strokeWidth: 1.5 },
        });
      }
    }
  }

  return { nodes, edges };
}

function ImportPage() {
  const [imported, setImported] = useState<{ nodes: Node<FamilyNodeData>[]; edges: Edge[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const result = parseGedcom(text);
        if (result.nodes.length === 0) {
          setError("No individuals found in this GEDCOM file.");
        } else {
          setImported(result);
          localStorage.setItem("family-tree-nodes", JSON.stringify(result.nodes));
          localStorage.setItem("family-tree-edges", JSON.stringify(result.edges));
        }
      } catch (err: any) {
        setError(err.message || "Failed to parse GEDCOM file.");
      }
      setLoading(false);
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      setLoading(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#F5F2E9]">
      <div className="mx-auto max-w-2xl p-6">
        <Link
          to="/tree/$id"
          params={{ id: "1" }}
          className="inline-flex items-center gap-1.5 text-xs text-[#8C8782] hover:text-[#2D2926] mb-6"
        >
          <ArrowLeft className="size-3.5" />
          Back to tree
        </Link>

        <Card className="border-[#D6D0BE] shadow-sm">
          <CardHeader>
            <CardTitle className="font-['Playfair_Display'] text-lg font-semibold text-[#2D2926] flex items-center gap-2">
              <Upload className="size-4 text-[#7D6B3D]" />
              Import GEDCOM
            </CardTitle>
            <CardDescription className="text-xs text-[#5E5954]">
              Upload a GEDCOM (.ged) file to populate your family tree.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[#D6D0BE] bg-white p-8 text-center hover:border-[#7D6B3D] transition-colors"
            >
              <FileText className="size-8 text-[#8C8782]" />
              <div>
                <p className="text-sm font-medium text-[#2D2926]">
                  {loading ? "Reading file..." : "Click to select a .ged file"}
                </p>
                <p className="text-xs text-[#8C8782] mt-0.5">
                  GEDCOM 5.5.1 format supported
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".ged,.gedcom"
                className="hidden"
                onChange={handleFile}
              />
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {error}
              </div>
            )}

            {imported && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                <CheckCircle className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-medium">Import successful!</p>
                  <p className="text-green-600">
                    {imported.nodes.length} individuals, {imported.edges.length} relationships found.
                  </p>
                  <Link
                    to="/tree/$id"
                    params={{ id: "1" }}
                    className="mt-2 inline-block rounded-lg bg-[#7D6B3D] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#6A5A32]"
                  >
                    View tree
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
