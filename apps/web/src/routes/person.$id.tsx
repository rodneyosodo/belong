import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@workspace/ui/components/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Separator } from '@workspace/ui/components/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@workspace/ui/components/sidebar';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

import { AppSidebar } from '@/components/app-sidebar';
import type { FamilyNodeData } from '@/components/family-tree-node';
import { personApi, relationshipApi, type Person, type Relationship } from '@/lib/api';

export const Route = createFileRoute('/person/$id')({
  component: PersonPage,
});

function computeAge(dob?: string, dod?: string): string {
  if (!dob) return '—';
  const birth = new Date(dob);
  const end = dod ? new Date(dod) : new Date();
  let age = end.getFullYear() - birth.getFullYear();
  const m = end.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--;
  return String(age);
}

function personLabel(p: Person): string {
  return `${p.first_name} ${p.last_name}`.trim();
}

function PersonPage() {
  const { id } = Route.useParams();
  const [person, setPerson] = useState<Person | null>(null);
  const [relations, setRelations] = useState<{ rel: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const p = await personApi.get(id);
        setPerson(p);

        const treeId = p.tree_id;
        const [allRels, allPersonsForTree] = await Promise.all([
          relationshipApi.list(treeId),
          personApi.list(treeId),
        ]);

        const personMap = new Map(allPersonsForTree.map((x) => [x.id, x]));
        const relList: { rel: string; name: string }[] = [];

        for (const r of allRels) {
          if (r.person_a_id === id || r.person_b_id === id) {
            const otherId = r.person_a_id === id ? r.person_b_id : r.person_a_id;
            const other = personMap.get(otherId);
            if (!other) continue;

            if (r.type === 'spouse') {
              relList.push({ rel: 'Spouse', name: personLabel(other) });
            } else if (r.type === 'parent') {
              if (r.person_a_id === id) {
                relList.push({ rel: 'Child', name: personLabel(other) });
              } else {
                relList.push({ rel: 'Parent', name: personLabel(other) });
              }
            } else if (r.type === 'child') {
              if (r.person_a_id === id) {
                relList.push({ rel: 'Child', name: personLabel(other) });
              } else {
                relList.push({ rel: 'Parent', name: personLabel(other) });
              }
            } else {
              relList.push({ rel: r.type, name: personLabel(other) });
            }
          }
        }
        setRelations(relList);
      } catch (err) {
        console.error('Failed to load person:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center text-[#8C8782]">Loading...</div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!person) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="p-8 text-[#8C8782]">Person not found</div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const data: Partial<FamilyNodeData> = {
    label: personLabel(person),
    firstName: person.first_name,
    lastName: person.last_name,
    gender: (person.gender as FamilyNodeData['gender']) || undefined,
    dateOfBirth: person.date_of_birth || undefined,
    dateOfDeath: person.date_of_death || undefined,
    photo: person.avatar_url || undefined,
    notes: (person.metadata as Record<string, unknown>)?.notes as string | undefined,
  };

  const age = computeAge(data.dateOfBirth, data.dateOfDeath);
  const initials = data
    .label!.split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
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
                  <Link
                    to="/tree/$id"
                    params={{ id: person.tree_id }}
                    className="hover:text-[#2D2926]"
                  >
                    Tree
                  </Link>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{data.label}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex-1 bg-[#F5F2E9]">
          <div className="mx-auto max-w-5xl p-6">
            <Card className="mb-6 border-[#D6D0BE] shadow-sm">
          <CardContent className="flex items-center gap-5 p-6">
            {data.photo ? (
              <img
                src={data.photo}
                alt=""
                className="size-16 rounded-full border border-[#D6D0BE] object-cover"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-full bg-[#7D6B3D] text-lg font-bold text-white">
                {initials}
              </div>
            )}
            <div>
              <h1 className="font-['Playfair_Display'] text-2xl font-semibold text-[#2D2926]">
                {data.label}
              </h1>
              <div className="mt-1 flex items-center gap-3 text-sm text-[#5E5954]">
                <span>
                  {data.dateOfBirth || '?'} — {data.dateOfDeath || 'Present'}
                </span>
                <span className="text-[#D6D0BE]">|</span>
                <span className="capitalize">{data.gender || '—'}</span>
                <span className="text-[#D6D0BE]">|</span>
                <span>Age: {age}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          <Card className="border-[#D6D0BE] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-['Playfair_Display'] text-base font-semibold text-[#2D2926]">
                Biography
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-[#5E5954]">
                {data.notes || 'No biography available.'}
              </p>
            </CardContent>
          </Card>

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
                  <dd className="font-medium text-[#2D2926] capitalize">{data.gender || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#8C8782]">Age</dt>
                  <dd className="font-medium text-[#2D2926]">{age}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#8C8782]">Birth</dt>
                  <dd className="font-medium text-[#2D2926]">{data.dateOfBirth || '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#8C8782]">Death</dt>
                  <dd className="font-medium text-[#2D2926]">{data.dateOfDeath || '—'}</dd>
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

          <Card className="border-[#D6D0BE] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-['Playfair_Display'] text-base font-semibold text-[#2D2926]">
                Life Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-4 before:absolute before:top-1 before:left-0 before:h-[calc(100%-8px)] before:w-0.5 before:bg-[#D6D0BE]">
                <div className="mb-3">
                  <p className="text-xs font-medium text-[#7D6B3D]">{data.dateOfBirth || '?'}</p>
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
      </SidebarInset>
    </SidebarProvider>
  );
}
