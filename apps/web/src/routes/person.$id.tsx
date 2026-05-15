import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { initialNodes, initialEdges } from "@/components/family-tree-data"
import type { FamilyNodeData } from "@/components/family-tree-node"

export const Route = createFileRoute("/person/$id")({
  component: PersonPage,
})

function computeAge(dob?: string, dod?: string): string {
  if (!dob) return "—";
  const birth = new Date(dob);
  const end = dod ? new Date(dod) : new Date();
  let age = end.getFullYear() - birth.getFullYear();
  const m = end.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--;
  return String(age);
}

function PersonPage() {
  const { id } = Route.useParams();
  const node = initialNodes.find((n) => n.id === id);
  if (!node) return <div className="p-8 text-[#8C8782]">Person not found</div>;
  const data = node.data as unknown as FamilyNodeData;

  const spouse = initialEdges
    .filter((e) => e.label === "spouse" && (e.source === id || e.target === id))
    .map((e) => {
      const otherId = e.source === id ? e.target : e.source;
      return initialNodes.find((n) => n.id === otherId);
    })
    .filter(Boolean);

  const parents = initialEdges
    .filter((e) => e.target === id && e.type === "smoothstep")
    .map((e) => initialNodes.find((n) => n.id === e.source))
    .filter(Boolean);

  const children = initialEdges
    .filter((e) => e.source === id && e.type === "smoothstep")
    .map((e) => initialNodes.find((n) => n.id === e.target))
    .filter(Boolean);

  const siblings = initialEdges
    .filter((e) => e.type === "smoothstep" && e.target === id)
    .flatMap((e) =>
      initialEdges
        .filter((pe) => pe.source === e.source && pe.target !== id && pe.type === "smoothstep")
        .map((se) => initialNodes.find((n) => n.id === se.target)),
    )
    .filter(Boolean);

  const relations = [
    ...spouse.map((n) => ({ rel: "Spouse", name: n!.data.label })),
    ...parents.map((n) => ({ rel: "Parent", name: n!.data.label })),
    ...children.map((n) => ({ rel: "Child", name: n!.data.label })),
    ...siblings.map((n) => ({ rel: "Sibling", name: n!.data.label })),
  ];

  const age = computeAge(data.dateOfBirth, data.dateOfDeath);

  return (
    <div className="min-h-screen bg-[#F5F2E9]">
      <div className="mx-auto max-w-5xl p-6">
        <Link
          to="/tree/$id"
          params={{ id: "1" }}
          className="inline-flex items-center gap-1.5 text-xs text-[#8C8782] hover:text-[#2D2926] mb-6"
        >
          <ArrowLeft className="size-3.5" />
          Back to tree
        </Link>

        {/* Card 1 — Header */}
        <Card className="mb-6 border-[#D6D0BE] shadow-sm">
          <CardContent className="flex items-center gap-5 p-6">
            {data.photo ? (
              <img
                src={data.photo}
                alt=""
                className="size-16 rounded-full object-cover border border-[#D6D0BE]"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-full bg-[#7D6B3D] text-lg font-bold text-white">
                {data.label.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)}
              </div>
            )}
            <div>
              <h1 className="font-['Playfair_Display'] text-2xl font-semibold text-[#2D2926]">
                {data.label}
              </h1>
              <div className="mt-1 flex items-center gap-3 text-sm text-[#5E5954]">
                <span>{data.dateOfBirth || "?"} — {data.dateOfDeath || "Present"}</span>
                <span className="text-[#D6D0BE]">|</span>
                <span className="capitalize">{data.gender}</span>
                <span className="text-[#D6D0BE]">|</span>
                <span>Age: {age}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          {/* Card 2 — Biography */}
          <Card className="border-[#D6D0BE] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-['Playfair_Display'] text-base font-semibold text-[#2D2926]">
                Biography
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-[#5E5954]">
                {data.notes || "No biography available."}
              </p>
            </CardContent>
          </Card>

          {/* Card 3 — Personal Details */}
          <Card className="border-[#D6D0BE] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-['Playfair_Display'] text-base font-semibold text-[#2D2926]">
                Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#8C8782]">Gender</dt>
                  <dd className="font-medium text-[#2D2926] capitalize">{data.gender || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#8C8782]">Age</dt>
                  <dd className="font-medium text-[#2D2926]">{age}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#8C8782]">Birth</dt>
                  <dd className="font-medium text-[#2D2926]">{data.dateOfBirth || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#8C8782]">Death</dt>
                  <dd className="font-medium text-[#2D2926]">{data.dateOfDeath || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#8C8782]">Birth Place</dt>
                  <dd className="font-medium text-[#2D2926]">—</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#8C8782]">Occupation</dt>
                  <dd className="font-medium text-[#2D2926]">—</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Card 4 — Family Relations */}
          <Card className="border-[#D6D0BE] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-['Playfair_Display'] text-base font-semibold text-[#2D2926]">
                Family Relations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {relations.length === 0 ? (
                <p className="text-sm text-[#8C8782]">No relations found.</p>
              ) : (
                <ul className="space-y-2">
                  {relations.slice(0, 6).map((r, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="rounded bg-[#EDEAD8] px-1.5 py-0.5 text-[10px] font-medium text-[#7D6B3D] uppercase">
                        {r.rel}
                      </span>
                      <span className="text-[#2D2926]">{r.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Card 5 — Life Timeline */}
          <Card className="border-[#D6D0BE] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-['Playfair_Display'] text-base font-semibold text-[#2D2926]">
                Life Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-4 before:absolute before:left-0 before:top-1 before:h-[calc(100%-8px)] before:w-0.5 before:bg-[#D6D0BE]">
                <div className="mb-3">
                  <p className="text-xs font-medium text-[#7D6B3D]">{data.dateOfBirth || "?"}</p>
                  <p className="text-sm text-[#2D2926]">Born</p>
                </div>
                {data.dateOfDeath ? (
                  <div>
                    <p className="text-xs font-medium text-[#7D6B3D]">{data.dateOfDeath}</p>
                    <p className="text-sm text-[#2D2926]">Deceased</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-medium text-[#7D6B3D]">Present</p>
                    <p className="text-sm text-[#2D2926]">Living</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
