import { createFileRoute } from '@tanstack/react-router';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@workspace/ui/components/breadcrumb';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Separator } from '@workspace/ui/components/separator';
import { SidebarTrigger } from '@workspace/ui/components/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Loader2, SaveIcon, UploadIcon, Trash2Icon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@workspace/ui/components/skeleton';

import { MembersPanel } from '@/components/members-panel';
import { treeApi, uploadCoverImage, type Tree } from '@/lib/api';

export const Route = createFileRoute('/_shell/tree/$id_/settings')({
  component: TreeSettingsPage,
});

function TreeSettingsPage() {
  const { id } = Route.useParams();
  const [tree, setTree] = useState<Tree | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await treeApi.get(id);
        setTree(data);
        setName(data.name);
        setDescription(data.description);
        setIsPublic(data.is_public);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load tree');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await treeApi.update(id, {
        name: name.trim(),
        description: description.trim(),
        is_public: isPublic,
      });
      setTree(updated);
      toast.success('Settings saved');
      window.dispatchEvent(new Event('trees-changed'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadCoverImage(id, file);
      setTree((prev) => (prev ? { ...prev, cover_image: result.cover_image } : prev));
      toast.success('Cover image updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload cover');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${tree?.name}"? This cannot be undone.`)) return;
    try {
      await treeApi.delete(id);
      toast.success('Tree deleted');
      window.location.href = '/';
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete tree');
    }
  };

  if (loading) {
    return (
      <>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Skeleton className="h-4 w-32" />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <Skeleton className="h-7 w-36" />
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!tree) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-red-600">Tree not found</p>
      </div>
    );
  }

  const isOwner = tree.user_role === 'owner';

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
                <BreadcrumbLink href={`/tree/${id}`}>{tree.name}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <h1 className="font-['Playfair_Display'] text-2xl font-semibold text-[#2D2926]">
          Tree Settings
        </h1>

        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            {isOwner && <TabsTrigger value="members">Members</TabsTrigger>}
            {isOwner && <TabsTrigger value="danger">Danger Zone</TabsTrigger>}
          </TabsList>

          <TabsContent value="general" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General</CardTitle>
                <CardDescription>
                  Update the name, description, and visibility of your tree.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Tree Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Anderson Family"
                    disabled={!isOwner}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this family tree..."
                    rows={3}
                    className="border-input bg-background resize-none rounded-lg border px-3 py-2.5 text-sm outline-none"
                    disabled={!isOwner}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Cover Image</Label>
                  <div className="flex items-center gap-3">
                    {tree.cover_image ? (
                      <div
                        className="size-16 rounded-lg border bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${tree.cover_image})`,
                        }}
                      />
                    ) : (
                      <div className="flex size-16 items-center justify-center rounded-lg border bg-[#E8E4D8]">
                        <UploadIcon className="size-5 text-[#8C8782]" />
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading || !isOwner}
                      onClick={() => fileRef.current?.click()}
                    >
                      {uploading ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <UploadIcon className="mr-2 size-4" />
                      )}
                      {tree.cover_image ? 'Change image' : 'Upload image'}
                    </Button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverUpload}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="is_public">Public</Label>
                  <input
                    id="is_public"
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    disabled={!isOwner}
                    className="size-4 rounded border-[#D6D0BE]"
                  />
                  <span className="text-sm text-[#8C8782]">
                    Allow anyone with the link to view this tree
                  </span>
                </div>
                {isOwner && (
                  <Button onClick={handleSave} disabled={saving} className="self-start">
                    {saving ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <SaveIcon className="mr-2 size-4" />
                    )}
                    Save Changes
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isOwner && (
            <TabsContent value="members" className="mt-4">
              <MembersPanel treeId={id} />
            </TabsContent>
          )}

          {isOwner && (
            <TabsContent value="danger" className="mt-4">
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-700">Danger Zone</CardTitle>
                  <CardDescription>
                    Permanently delete this tree and all its data.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2Icon className="mr-2 size-4" />
                    Delete Tree
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  );
}
