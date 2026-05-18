import { createFileRoute } from '@tanstack/react-router';
import { useNavigate } from '@tanstack/react-router';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
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
import { Skeleton } from '@workspace/ui/components/skeleton';
import { useTheme } from '@workspace/ui/components/theme-provider';
import { ToggleGroup, ToggleGroupItem } from '@workspace/ui/components/toggle-group';
import {
  Eye,
  EyeOff,
  Loader2,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SaveIcon,
  SunIcon,
  UploadIcon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { authClient } from '@/lib/auth-client';
import { env } from '@/lib/env';

export const Route = createFileRoute('/_shell/profile')({
  component: ProfileForm,
});

function ProfileForm() {
  const { data: session, isPending, error, refetch } = authClient.useSession();
  const [profileLoading, setProfileLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const user = session?.user;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }

    setUploadLoading(true);

    const body = new FormData();
    body.append('file', file);

    try {
      const res = await fetch(`${env.BELONG_BACKEND_URL}/api/upload/avatar`, {
        method: 'POST',
        credentials: 'include',
        body,
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? 'Failed to upload avatar');
      } else {
        refetch();
        toast.success('Avatar updated');
      }
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;

    const { error: updateError } = await authClient.updateUser({
      name: name.trim() || undefined,
    });

    setProfileLoading(false);

    if (updateError) {
      toast.error(updateError.message ?? 'Failed to update profile');
      return;
    }

    refetch();
    toast.success('Profile updated');
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPwLoading(true);

    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('current-password') as string;
    const newPassword = formData.get('new-password') as string;
    const confirmPassword = formData.get('confirm-password') as string;

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      setPwLoading(false);
      return;
    }

    const { error: pwError } = await authClient.changePassword({
      currentPassword,
      newPassword,
    });

    setPwLoading(false);

    if (pwError) {
      toast.error(pwError.message ?? 'Failed to change password');
      return;
    }

    toast.success('Password changed');
    e.currentTarget.reset();
  };

  const handleSignOut = async () => {
    const { error: signOutError } = await authClient.signOut();
    if (signOutError) {
      toast.error(signOutError.message ?? 'Failed to sign out');
      return;
    }
    navigate({ to: '/login' });
  };

  const { theme, setTheme } = useTheme();

  if (isPending) {
    return (
      <>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Skeleton className="h-4 w-20" />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
          <div className="space-y-6">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-red-600">Failed to load profile</p>
      </div>
    );
  }

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
                <BreadcrumbPage>Profile</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="size-16">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback className="text-xl">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {uploadLoading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                <Loader2 className="size-5 animate-spin text-white" />
              </div>
            )}
          </div>
          <div>
            <h1 className="font-['Playfair_Display'] text-2xl font-semibold text-[#2D2926]">
              {user.name}
            </h1>
            <p className="text-sm text-[#5E5954]">{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleProfileUpdate}>
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your display name and avatar.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" type="text" defaultValue={user.name} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="avatar">Avatar</Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadLoading}
                    onClick={() => document.getElementById('avatar-input')?.click()}
                  >
                    {uploadLoading ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <UploadIcon className="mr-2 size-4" />
                    )}
                    Choose file
                  </Button>
                  <span className="text-muted-foreground text-sm">PNG, JPG up to 5MB</span>
                </div>
                <input
                  id="avatar-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
              <Button type="submit" disabled={profileLoading} className="self-start">
                {profileLoading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <SaveIcon className="mr-2 size-4" />
                )}
                Save
              </Button>
            </CardContent>
          </Card>
        </form>

        <form onSubmit={handlePasswordChange}>
          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <CardDescription>
                Update your password. You&apos;ll need your current password.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="current-password">Current password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    name="current-password"
                    type={showCurrent ? 'text' : 'password'}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((s) => !s)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-password">New password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    name="new-password"
                    type={showNew ? 'text' : 'password'}
                    required
                    minLength={8}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((s) => !s)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    name="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    minLength={8}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={pwLoading} className="self-start">
                {pwLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Change password
              </Button>
            </CardContent>
          </Card>
        </form>

        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>Choose your preferred appearance.</CardDescription>
          </CardHeader>
          <CardContent>
            <ToggleGroup
              value={[theme]}
              onValueChange={(v) => {
                const next = v.find((x) => x !== theme) || theme;
                setTheme(next as 'light' | 'dark' | 'system');
              }}
              variant="outline"
            >
              <ToggleGroupItem value="light">
                <SunIcon data-icon="inline-start" />
                Light
              </ToggleGroupItem>
              <ToggleGroupItem value="dark">
                <MoonIcon data-icon="inline-start" />
                Dark
              </ToggleGroupItem>
              <ToggleGroupItem value="system">
                <MonitorIcon data-icon="inline-start" />
                System
              </ToggleGroupItem>
            </ToggleGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
            <CardDescription>Sign out of your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOutIcon className="mr-2 size-4" />
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
