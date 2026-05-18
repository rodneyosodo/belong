import { createFileRoute, Link } from '@tanstack/react-router';
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
import { SidebarTrigger } from '@workspace/ui/components/sidebar';
import {
  BabyIcon,
  CalendarIcon,
  CrossIcon,
  HeartIcon,
  Loader2,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

import type { FamilyNodeData } from '@/components/family-tree-node';
import {
  personApi,
  relationshipApi,
  eventApi,
  type Person,
  type PersonEvent,
} from '@/lib/api';
import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';

export const Route = createFileRoute('/_shell/person/$id')({
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

type TimelineEntry = {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'birth' | 'death' | 'marriage' | 'custom';
  eventId?: string;
  sortKey: string;
};

const eventTypeIcons: Record<string, React.ElementType> = {
  birth: BabyIcon,
  death: CrossIcon,
  marriage: HeartIcon,
  custom: CalendarIcon,
};

const eventTypeColors: Record<string, string> = {
  birth: 'bg-emerald-100 text-emerald-700',
  death: 'bg-gray-100 text-gray-600',
  marriage: 'bg-rose-100 text-rose-700',
  custom: 'bg-amber-100 text-amber-700',
};

const eventTypes = [
  { value: 'custom', label: 'Custom Event' },
  { value: 'education', label: 'Education' },
  { value: 'career', label: 'Career' },
  { value: 'residence', label: 'Residence' },
  { value: 'military', label: 'Military' },
  { value: 'award', label: 'Award' },
  { value: 'medical', label: 'Medical' },
  { value: 'travel', label: 'Travel' },
];

function PersonPage() {
  const { id } = Route.useParams();
  const [person, setPerson] = useState<Person | null>(null);
  const [relations, setRelations] = useState<{ rel: string; name: string }[]>([]);
  const [events, setEvents] = useState<PersonEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PersonEvent | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventType, setEventType] = useState('custom');
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [deletingEventTitle, setDeletingEventTitle] = useState('');
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const p = await personApi.get(id);
      setPerson(p);

      const treeId = p.tree_id;
      const [allRels, allPersonsForTree, allEvents] = await Promise.all([
        relationshipApi.list(treeId),
        personApi.list(treeId),
        eventApi.list(id),
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
      setEvents(allEvents);
    } catch (err) {
      console.error('Failed to load person:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const spouses = relations.filter((r) => r.rel === 'Spouse');

  const timelineEntries: TimelineEntry[] = [];

  if (person) {
    if (person.date_of_birth) {
      timelineEntries.push({
        id: '__birth__',
        date: person.date_of_birth,
        title: 'Born',
        description: personLabel(person),
        type: 'birth',
        sortKey: person.date_of_birth,
      });
    }

    for (const s of spouses) {
      timelineEntries.push({
        id: `__marriage_${s.name}__`,
        date: '',
        title: 'Marriage',
        description: `Married ${s.name}`,
        type: 'marriage',
        sortKey: '',
      });
    }

    if (person.date_of_death) {
      timelineEntries.push({
        id: '__death__',
        date: person.date_of_death,
        title: 'Deceased',
        description: '',
        type: 'death',
        sortKey: person.date_of_death,
      });
    }

    for (const e of events) {
      timelineEntries.push({
        id: e.id,
        date: e.date,
        title: e.title,
        description: e.description,
        type: 'custom',
        eventId: e.id,
        sortKey: e.date || e.created_at,
      });
    }

    timelineEntries.sort((a, b) => {
      const ka = a.sortKey || '9999';
      const kb = b.sortKey || '9999';
      return ka.localeCompare(kb);
    });
  }

  const openAddDialog = () => {
    setEditingEvent(null);
    setEventTitle('');
    setEventDate('');
    setEventDescription('');
    setEventType('custom');
    setDialogOpen(true);
  };

  const openEditDialog = (event: PersonEvent) => {
    setEditingEvent(event);
    setEventTitle(event.title);
    setEventDate(event.date);
    setEventDescription(event.description);
    setEventType(event.type);
    setDialogOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!eventTitle.trim()) return;
    setSaving(true);
    try {
      if (editingEvent) {
        await eventApi.update(id, editingEvent.id, {
          title: eventTitle.trim(),
          date: eventDate,
          description: eventDescription,
          type: eventType,
        });
        toast.success('Event updated');
      } else {
        await eventApi.create(id, {
          title: eventTitle.trim(),
          date: eventDate,
          description: eventDescription,
          type: eventType,
        });
        toast.success('Event added');
      }
      setDialogOpen(false);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!deletingEventId) return;
    setDeleting(true);
    try {
      await eventApi.delete(id, deletingEventId);
      toast.success('Event deleted');
      setDeleteOpen(false);
      setDeletingEventId(null);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-[#8C8782]">
        <Loader2 className="size-8 animate-spin text-[#7D6B3D]" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="p-8 text-[#8C8782]">Person not found</div>
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
                    <dd className="font-medium text-[#2D2926] capitalize">
                      {data.gender || '—'}
                    </dd>
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
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-['Playfair_Display'] text-base font-semibold text-[#2D2926]">
                  Life Timeline
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openAddDialog}
                  className="h-7 gap-1 px-2 text-xs text-[#7D6B3D] hover:text-[#6A5A32]"
                >
                  <PlusIcon className="size-3" />
                  Add Event
                </Button>
              </CardHeader>
              <CardContent>
                {timelineEntries.length === 0 ? (
                  <p className="text-sm text-[#8C8782]">No timeline events.</p>
                ) : (
                  <div className="relative pl-6">
                    <div className="absolute top-1 bottom-1 left-[7px] w-0.5 bg-[#D6D0BE]" />
                    <div className="space-y-4">
                      {timelineEntries.map((entry) => {
                        const Icon = eventTypeIcons[entry.type] || CalendarIcon;
                        const colorClass = eventTypeColors[entry.type] || eventTypeColors.custom;

                        return (
                          <div key={entry.id} className="relative">
                            <div
                              className={`absolute -left-6 top-0.5 flex size-4 items-center justify-center rounded-full ${colorClass}`}
                            >
                              <Icon className="size-2.5" />
                            </div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-[#7D6B3D]">
                                  {entry.date || '—'}
                                </p>
                                <p className="text-sm font-medium text-[#2D2926]">
                                  {entry.title}
                                </p>
                                {entry.description && (
                                  <p className="mt-0.5 text-xs text-[#5E5954]">
                                    {entry.description}
                                  </p>
                                )}
                              </div>
                              {entry.eventId && (
                                <div className="flex shrink-0 gap-1">
                                  <button
                                    onClick={() => {
                                      const ev = events.find(
                                        (e) => e.id === entry.eventId,
                                      );
                                      if (ev) openEditDialog(ev);
                                    }}
                                    className="rounded p-1 text-[#8C8782] hover:bg-[#EDEAD8] hover:text-[#2D2926]"
                                  >
                                    <PencilIcon className="size-3" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeletingEventId(entry.eventId!);
                                      setDeletingEventTitle(entry.title);
                                      setDeleteOpen(true);
                                    }}
                                    className="rounded p-1 text-[#8C8782] hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2Icon className="size-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-[#D6D0BE] bg-[#EDEAD8] p-0 sm:max-w-md">
          <DialogHeader className="flex flex-row items-center gap-3 border-b border-[#D6D0BE] p-5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#7D6B3D]">
              <CalendarIcon className="size-4 text-[#F5F2E9]" />
            </div>
            <div>
              <DialogTitle className="font-['Playfair_Display'] text-lg font-semibold text-[#2D2926]">
                {editingEvent ? 'Edit Event' : 'Add Event'}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#5E5954]">
                {editingEvent
                  ? 'Update this life event'
                  : 'Add a life event to the timeline'}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-4 px-5 pb-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-medium text-[#2D2926]">Event Type</Label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="h-10 rounded-lg border border-[#D6D0BE] bg-[#F5F2E9] px-3 text-sm text-[#2D2926]"
              >
                {eventTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-medium text-[#2D2926]">Title</Label>
              <Input
                placeholder="e.g. Graduated from University"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="h-10 rounded-lg border-[#D6D0BE] bg-[#F5F2E9] px-3 text-sm text-[#2D2926] outline-none placeholder:text-[#8C8782]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-medium text-[#2D2926]">
                Date <span className="text-[#8C8782]">(optional)</span>
              </Label>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="h-10 rounded-lg border-[#D6D0BE] bg-[#F5F2E9] px-3 text-sm text-[#2D2926] outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-medium text-[#2D2926]">
                Description <span className="text-[#8C8782]">(optional)</span>
              </Label>
              <textarea
                placeholder="Details about this event..."
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                rows={3}
                className="h-20 resize-none rounded-lg border border-[#D6D0BE] bg-[#F5F2E9] px-3 py-2 text-sm text-[#2D2926] outline-none placeholder:text-[#8C8782]"
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 border-t border-[#D6D0BE] p-5">
            <DialogClose
              render={
                <Button
                  variant="ghost"
                  className="h-9 rounded-lg border border-[#D6D0BE] bg-white px-4 text-sm font-medium text-[#5E5954] hover:bg-[#EDEADE]"
                >
                  Cancel
                </Button>
              }
            />
            <Button
              disabled={!eventTitle.trim() || saving}
              onClick={handleSaveEvent}
              className="h-9 rounded-lg bg-[#7D6B3D] px-4 text-sm font-semibold text-[#F5F2E9] hover:bg-[#6A5A32] disabled:opacity-50"
            >
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editingEvent ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-2xl border-[#D6D0BE] bg-[#EDEAD8] p-0 sm:max-w-sm">
          <DialogHeader className="flex flex-row items-center gap-3 border-b border-[#D6D0BE] p-5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-red-100">
              <Trash2Icon className="size-4 text-red-600" />
            </div>
            <div>
              <DialogTitle className="font-['Playfair_Display'] text-lg font-semibold text-[#2D2926]">
                Delete Event
              </DialogTitle>
              <DialogDescription className="text-xs text-[#5E5954]">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="px-5 py-4">
            <p className="text-sm text-[#5E5954]">
              Are you sure you want to delete{' '}
              <span className="font-medium text-[#2D2926]">{deletingEventTitle}</span>?
            </p>
          </div>
          <DialogFooter className="flex items-center justify-end gap-2 border-t border-[#D6D0BE] p-5">
            <Button
              variant="ghost"
              onClick={() => setDeleteOpen(false)}
              className="h-9 rounded-lg border border-[#D6D0BE] bg-white px-4 text-sm font-medium text-[#5E5954]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={handleDeleteEvent}
              className="h-9 rounded-lg px-4 text-sm font-semibold"
            >
              {deleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
