import { useState, useRef, useEffect, type ChangeEvent } from "react"
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router"
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, PlusIcon } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Separator } from "@workspace/ui/components/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@workspace/ui/components/card"
import { importApi, treeApi, type Tree } from "@/lib/api"

export const Route = createFileRoute("/import")({
  validateSearch: (search: Record<string, unknown>) => ({
    treeId: (search.treeId as string) || "",
  }),
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

interface ParsedPerson {
  idx: number;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  date_of_death: string;
}

interface ParsedRelationship {
  person_a_id: number;
  person_b_id: number;
  type: string;
}

function parseGedcom(text: string): { persons: ParsedPerson[]; relationships: ParsedRelationship[] } {
  const lines = tokenize(text);
  const tree = buildTree(lines);

  const individuals: Record<string, any> = {};
  const families: Record<string, any> = {};

  for (const node of tree) {
    if (node.tag === "INDI" && node.xref) individuals[node.xref] = node;
    if (node.tag === "FAM" && node.xref) families[node.xref] = node;
  }

  let idCounter = 0;
  const idMap: Record<string, number> = {};

  function getId(xref: string): number {
    if (idMap[xref] === undefined) idMap[xref] = idCounter++;
    return idMap[xref];
  }

  const persons: ParsedPerson[] = [];

  for (const [xref, node] of Object.entries(individuals)) {
    const idx = getId(xref);
    const nameVal = findChildValue(node, "NAME") || "Unknown";
    const { firstName, lastName } = parseName(nameVal);
    const sex = findChildValue(node, "SEX");
    const gender = sex === "F" ? "female" : sex === "M" ? "male" : "";
    const birthDate = normalizeDate(getAllValues(node, ["BIRT", "DATE"])) || "";
    const deathDate = normalizeDate(getAllValues(node, ["DEAT", "DATE"])) || "";

    persons.push({
      idx,
      first_name: firstName,
      last_name: lastName,
      gender,
      date_of_birth: birthDate,
      date_of_death: deathDate,
    });
  }

  const relationships: ParsedRelationship[] = [];

  for (const [, node] of Object.entries(families)) {
    const husb = findChildValue(node, "HUSB");
    const wife = findChildValue(node, "WIFE");
    const children = getTagValues(node, "CHIL");

    const husbIdx = husb ? getId(husb) : -1;
    const wifeIdx = wife ? getId(wife) : -1;

    if (husbIdx >= 0 && wifeIdx >= 0) {
      relationships.push({
        person_a_id: husbIdx,
        person_b_id: wifeIdx,
        type: "spouse",
      });
    }

    const motherIdx = wifeIdx >= 0 ? wifeIdx : husbIdx;

    for (const childXref of children) {
      const childIdx = getId(childXref);
      if (motherIdx >= 0 && childIdx >= 0) {
        relationships.push({
          person_a_id: motherIdx,
          person_b_id: childIdx,
          type: "child",
        });
      }
    }
  }

  return { persons, relationships };
}

function ImportPage() {
  const search = useSearch({ strict: false }) as { treeId: string };
  const navigate = useNavigate();
  const [trees, setTrees] = useState<Tree[]>([]);
  const [selectedTreeId, setSelectedTreeId] = useState(search.treeId);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ person_count: number; relationship_count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const parsedRef = useRef<{ persons: ParsedPerson[]; relationships: ParsedRelationship[] } | null>(null);

  useEffect(() => {
    treeApi.list().then((data) => {
      const all = [...data.owned, ...data.shared];
      setTrees(all);
      if (!selectedTreeId && all.length > 0) {
        setSelectedTreeId(all[0].id);
      }
    }).catch(() => {});
  }, [selectedTreeId]);

  const handleCreateTree = async () => {
    setCreating(true);
    setError(null);
    try {
      const tree = await treeApi.create({ name: "Imported Tree" });
      setTrees((prev) => [...prev, tree]);
      setSelectedTreeId(tree.id);
    } catch (err: any) {
      setError(err.message || "Failed to create tree.");
    } finally {
      setCreating(false);
    }
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = parseGedcom(text);
        if (parsed.persons.length === 0) {
          setError("No individuals found in this GEDCOM file.");
          parsedRef.current = null;
        } else {
          parsedRef.current = parsed;
          setResult({ person_count: parsed.persons.length, relationship_count: parsed.relationships.length });
        }
      } catch (err: any) {
        setError(err.message || "Failed to parse GEDCOM file.");
        parsedRef.current = null;
      }
      setLoading(false);
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      setLoading(false);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!parsedRef.current || !selectedTreeId) return;
    setUploading(true);
    setError(null);
    try {
      await importApi.gedcom(selectedTreeId, {
        persons: parsedRef.current.persons.map((p) => ({
          first_name: p.first_name,
          last_name: p.last_name,
          gender: p.gender,
          date_of_birth: p.date_of_birth,
          date_of_death: p.date_of_death,
        })),
        relationships: parsedRef.current.relationships,
      });
      navigate({ to: "/tree/$id", params: { id: selectedTreeId } });
    } catch (err: any) {
      setError(err.message || "Import failed.");
    } finally {
      setUploading(false);
    }
  };

  const selectedTree = trees.find((t) => t.id === selectedTreeId);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link to="/">Lineage</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Import GEDCOM</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center p-6">
          <Card className="w-full max-w-lg border-[#D6D0BE] shadow-sm">
            <CardHeader>
              <CardTitle className="font-['Playfair_Display'] text-lg font-semibold text-[#2D2926] flex items-center gap-2">
                <Upload className="size-4 text-[#7D6B3D]" />
                Import GEDCOM
              </CardTitle>
              <CardDescription className="text-xs text-[#5E5954]">
                Upload a GEDCOM (.ged) file to populate a family tree.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#2D2926]">Import into</label>
                {trees.length > 0 ? (
                  <select
                    value={selectedTreeId}
                    onChange={(e) => setSelectedTreeId(e.target.value)}
                    className="w-full rounded-lg border border-[#D6D0BE] bg-white px-3 py-2 text-sm text-[#2D2926] outline-none focus:border-[#7D6B3D]"
                  >
                    {trees.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.person_count ?? 0} people)</option>
                    ))}
                  </select>
                ) : (
                  <button
                    onClick={handleCreateTree}
                    disabled={creating}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#D6D0BE] bg-[#F5F2E9] px-4 py-2 text-sm font-medium text-[#2D2926] hover:bg-white disabled:opacity-50"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="size-4" />
                        Create New Tree
                      </>
                    )}
                  </button>
                )}
              </div>

              {selectedTreeId && (
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
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  {error}
                </div>
              )}

              {result && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                    <CheckCircle className="mt-0.5 size-4 shrink-0" />
                    <div>
                      <p className="font-medium">File parsed successfully!</p>
                      <p className="text-green-600">
                        {result.person_count} individuals, {result.relationship_count} relationships found.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleImport}
                    disabled={uploading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#7D6B3D] px-4 py-2.5 text-sm font-medium text-[#F5F2E9] hover:bg-[#6A5A32] disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="size-4" />
                        Import to {selectedTree?.name ?? "Tree"}
                      </>
                    )}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
