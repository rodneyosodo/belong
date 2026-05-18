import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@workspace/ui/components/breadcrumb';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@workspace/ui/components/card';
import { Separator } from '@workspace/ui/components/separator';
import { SidebarTrigger } from '@workspace/ui/components/sidebar';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  PlusIcon,
  UsersIcon,
  HeartIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState, useRef, useEffect, type ChangeEvent } from 'react';

import { importApi, treeApi, type Tree } from '@/lib/api';

export const Route = createFileRoute('/_shell/import')({
  validateSearch: (search: Record<string, unknown>) => ({
    treeId: (search.treeId as string) || '',
  }),
  component: ImportPage,
});

const MONTHS: Record<string, string> = {
  JAN: '01',
  FEB: '02',
  MAR: '03',
  APR: '04',
  MAY: '05',
  JUN: '06',
  JUL: '07',
  AUG: '08',
  SEP: '09',
  OCT: '10',
  NOV: '11',
  DEC: '12',
};

function normalizeDate(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;
  const parts = dateStr.split(' ');
  if (parts.length === 3) {
    const d = parts[0].padStart(2, '0');
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
  const cleaned = value.replace(/\//g, '').trim();
  const i = cleaned.lastIndexOf(' ');
  return i > 0
    ? { firstName: cleaned.slice(0, i), lastName: cleaned.slice(i + 1) }
    : { firstName: cleaned, lastName: '' };
}

type GedLine = { level: number; xref?: string; tag: string; value?: string };

function tokenize(text: string): GedLine[] {
  return text
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const trimmed = line.trim();
      const parts = trimmed.split(' ');
      const level = Number(parts[0]);
      if (Number.isNaN(level)) {
        throw new Error(`Invalid GEDCOM line: "${trimmed.slice(0, 80)}"`);
      }
      let idx = 1;
      let xref: string | undefined;
      if (parts[1]?.startsWith('@')) {
        xref = parts[1];
        idx = 2;
      }
      const tag = parts[idx] || '';
      const value =
        parts
          .slice(idx + 1)
          .join(' ')
          .trim() || undefined;
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

function parseGedcom(text: string): {
  persons: ParsedPerson[];
  relationships: ParsedRelationship[];
  warnings: string[];
} {
  const warnings: string[] = [];

  if (!text.trim()) {
    throw new Error('File is empty.');
  }

  const lines = tokenize(text);
  if (lines.length === 0) {
    throw new Error('No valid GEDCOM lines found in file.');
  }

  const hasHead = lines.some((l) => l.tag === 'HEAD');
  if (!hasHead) {
    warnings.push('File does not contain a HEAD record — it may not be a valid GEDCOM file.');
  }

  const tree = buildTree(lines);

  const individuals: Record<string, any> = {};
  const families: Record<string, any> = {};

  for (const node of tree) {
    if (node.tag === 'INDI' && node.xref) individuals[node.xref] = node;
    if (node.tag === 'FAM' && node.xref) families[node.xref] = node;
  }

  if (Object.keys(individuals).length === 0) {
    throw new Error('No individual records (INDI) found in this GEDCOM file.');
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
    const nameVal = findChildValue(node, 'NAME') || 'Unknown';
    const { firstName, lastName } = parseName(nameVal);
    const sex = findChildValue(node, 'SEX');
    const gender = sex === 'F' ? 'female' : sex === 'M' ? 'male' : '';
    const birthDate = normalizeDate(getAllValues(node, ['BIRT', 'DATE'])) || '';
    const deathDate = normalizeDate(getAllValues(node, ['DEAT', 'DATE'])) || '';

    if (nameVal === 'Unknown') {
      warnings.push(`Individual ${xref} has no NAME record.`);
    }

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
    const husb = findChildValue(node, 'HUSB');
    const wife = findChildValue(node, 'WIFE');
    const children = getTagValues(node, 'CHIL');

    const husbIdx = husb ? getId(husb) : -1;
    const wifeIdx = wife ? getId(wife) : -1;

    if (husbIdx >= 0 && wifeIdx >= 0) {
      relationships.push({
        person_a_id: husbIdx,
        person_b_id: wifeIdx,
        type: 'spouse',
      });
    }

    const motherIdx = wifeIdx >= 0 ? wifeIdx : husbIdx;

    for (const childXref of children) {
      const childIdx = getId(childXref);
      if (childIdx < 0) {
        warnings.push(`Family references unknown child ${childXref}.`);
        continue;
      }
      if (motherIdx >= 0) {
        relationships.push({
          person_a_id: motherIdx,
          person_b_id: childIdx,
          type: 'child',
        });
      }
    }
  }

  return { persons, relationships, warnings };
}

function GenderIcon({ gender }: { gender: string }) {
  if (gender === 'male') return <span className="text-xs text-blue-600">&#9794;</span>;
  if (gender === 'female') return <span className="text-xs text-pink-600">&#9792;</span>;
  return null;
}

function ImportPage() {
  const search = useSearch({ strict: false }) as { treeId: string };
  const navigate = useNavigate();
  const [trees, setTrees] = useState<Tree[]>([]);
  const [selectedTreeId, setSelectedTreeId] = useState(search.treeId);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{
    person_count: number;
    relationship_count: number;
    warnings: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showPersons, setShowPersons] = useState(false);
  const [showRelationships, setShowRelationships] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const parsedRef = useRef<{
    persons: ParsedPerson[];
    relationships: ParsedRelationship[];
    warnings: string[];
  } | null>(null);

  useEffect(() => {
    treeApi
      .list()
      .then((data) => {
        const all = [...data.owned, ...data.shared];
        setTrees(all);
        if (!selectedTreeId && all.length > 0) {
          setSelectedTreeId(all[0].id);
        }
      })
      .catch(() => {});
  }, [selectedTreeId]);

  const handleCreateTree = async () => {
    setCreating(true);
    setError(null);
    try {
      const tree = await treeApi.create({ name: 'Imported Tree' });
      setTrees((prev) => [...prev, tree]);
      setSelectedTreeId(tree.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create tree.');
    } finally {
      setCreating(false);
    }
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(ged|gedcom)$/i)) {
      setError('Please select a valid GEDCOM file (.ged or .gedcom).');
      return;
    }

    setError(null);
    setResult(null);
    setFileName(file.name);
    setLoading(true);
    const reader = new FileReader();
    reader.addEventListener('load', (evt) => {
      try {
        const text = (evt.target as FileReader)?.result as string;
        if (!text || text.length === 0) {
          throw new Error('File is empty.');
        }
        const parsed = parseGedcom(text);
        if (parsed.persons.length === 0) {
          setError('No individuals found in this GEDCOM file.');
          parsedRef.current = null;
        } else {
          parsedRef.current = parsed;
          setResult({
            person_count: parsed.persons.length,
            relationship_count: parsed.relationships.length,
            warnings: parsed.warnings,
          });
        }
      } catch (err: any) {
        setError(
          err.message ||
            'Failed to parse GEDCOM file. The file may be corrupted or in an unsupported format.',
        );
        parsedRef.current = null;
      }
      setLoading(false);
    });
    reader.addEventListener('error', () => {
      setError('Failed to read file. Please try again.');
      setLoading(false);
    });
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
      navigate({ to: '/tree/$id', params: { id: selectedTreeId } });
    } catch (err: any) {
      setError(err.message || 'Import failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const selectedTree = trees.find((t) => t.id === selectedTreeId);
  const parsed = parsedRef.current;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Lineage</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Import GEDCOM</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 items-start justify-center p-6">
        <div className="w-full max-w-2xl space-y-4">
          <Card className="border-[#D6D0BE] shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-['Playfair_Display'] text-lg font-semibold text-[#2D2926]">
                <Upload className="size-4 text-[#7D6B3D]" />
                Import GEDCOM
              </CardTitle>
              <CardDescription className="text-xs text-[#5E5954]">
                Upload a GEDCOM (.ged) file to populate a family tree.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#2D2926]">
                  Import into
                </label>
                {trees.length > 0 ? (
                  <select
                    value={selectedTreeId}
                    onChange={(e) => setSelectedTreeId(e.target.value)}
                    className="w-full rounded-lg border border-[#D6D0BE] bg-white px-3 py-2 text-sm text-[#2D2926] outline-none focus:border-[#7D6B3D]"
                  >
                    {trees.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.person_count ?? 0} people)
                      </option>
                    ))}
                  </select>
                ) : (
                  <button
                    type="button"
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
                  className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[#D6D0BE] bg-white p-8 text-center transition-colors hover:border-[#7D6B3D]"
                >
                  <FileText className="size-8 text-[#8C8782]" />
                  <div>
                    <p className="text-sm font-medium text-[#2D2926]">
                      {loading ? 'Reading file...' : (fileName ?? 'Click to select a .ged file')}
                    </p>
                    <p className="mt-0.5 text-xs text-[#8C8782]">GEDCOM 5.5.1 format supported</p>
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
                  <div>
                    <p className="font-medium">Import Error</p>
                    <p className="text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                    <CheckCircle className="mt-0.5 size-4 shrink-0" />
                    <div>
                      <p className="font-medium">File parsed successfully!</p>
                      <p className="text-green-600">
                        {result.person_count} individuals, {result.relationship_count} relationships
                        found.
                      </p>
                    </div>
                  </div>

                  {result.warnings.length > 0 && (
                    <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      <div>
                        <p className="font-medium">Warnings</p>
                        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-amber-600">
                          {result.warnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {parsed && result && (
            <>
              <Card className="border-[#D6D0BE] shadow-sm">
                <button
                  type="button"
                  onClick={() => setShowPersons(!showPersons)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-2">
                    <UsersIcon className="size-4 text-[#7D6B3D]" />
                    <span className="text-sm font-medium text-[#2D2926]">
                      Individuals ({parsed.persons.length})
                    </span>
                  </div>
                  {showPersons ? (
                    <ChevronUp className="size-4 text-[#8C8782]" />
                  ) : (
                    <ChevronDown className="size-4 text-[#8C8782]" />
                  )}
                </button>
                {showPersons && (
                  <div className="max-h-80 overflow-auto border-t border-[#D6D0BE]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-[#F5F2E9]">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-[#5E5954]">#</th>
                          <th className="px-4 py-2 text-left font-medium text-[#5E5954]">Name</th>
                          <th className="px-4 py-2 text-left font-medium text-[#5E5954]">Gender</th>
                          <th className="px-4 py-2 text-left font-medium text-[#5E5954]">Born</th>
                          <th className="px-4 py-2 text-left font-medium text-[#5E5954]">Died</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsed.persons.map((p) => (
                          <tr key={p.idx} className="border-t border-[#E8E4D8]">
                            <td className="px-4 py-2 text-[#8C8782]">{p.idx + 1}</td>
                            <td className="px-4 py-2 font-medium text-[#2D2926]">
                              {p.first_name} {p.last_name}
                            </td>
                            <td className="px-4 py-2">
                              <GenderIcon gender={p.gender} />
                              <span className="text-[#5E5954]">
                                {p.gender === 'male'
                                  ? 'Male'
                                  : p.gender === 'female'
                                    ? 'Female'
                                    : '—'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-[#5E5954]">{p.date_of_birth || '—'}</td>
                            <td className="px-4 py-2 text-[#5E5954]">{p.date_of_death || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              <Card className="border-[#D6D0BE] shadow-sm">
                <button
                  type="button"
                  onClick={() => setShowRelationships(!showRelationships)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-2">
                    <HeartIcon className="size-4 text-[#7D6B3D]" />
                    <span className="text-sm font-medium text-[#2D2926]">
                      Relationships ({parsed.relationships.length})
                    </span>
                  </div>
                  {showRelationships ? (
                    <ChevronUp className="size-4 text-[#8C8782]" />
                  ) : (
                    <ChevronDown className="size-4 text-[#8C8782]" />
                  )}
                </button>
                {showRelationships && (
                  <div className="max-h-80 overflow-auto border-t border-[#D6D0BE]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-[#F5F2E9]">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-[#5E5954]">#</th>
                          <th className="px-4 py-2 text-left font-medium text-[#5E5954]">
                            Person A
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-[#5E5954]">Type</th>
                          <th className="px-4 py-2 text-left font-medium text-[#5E5954]">
                            Person B
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsed.relationships.map((r, i) => {
                          const a = parsed.persons[r.person_a_id];
                          const b = parsed.persons[r.person_b_id];
                          return (
                            <tr key={i} className="border-t border-[#E8E4D8]">
                              <td className="px-4 py-2 text-[#8C8782]">{i + 1}</td>
                              <td className="px-4 py-2 text-[#2D2926]">
                                {a ? `${a.first_name} ${a.last_name}` : `#${r.person_a_id}`}
                              </td>
                              <td className="px-4 py-2 text-[#5E5954] capitalize">{r.type}</td>
                              <td className="px-4 py-2 text-[#2D2926]">
                                {b ? `${b.first_name} ${b.last_name}` : `#${r.person_b_id}`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              <button
                type="button"
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
                    Import {parsed.persons.length} people to {selectedTree?.name ?? 'Tree'}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
