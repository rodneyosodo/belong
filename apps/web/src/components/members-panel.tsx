import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
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
import { Loader2, UserPlusIcon, XIcon, ShieldIcon, EyeIcon, CrownIcon } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import { authClient } from '@/lib/auth-client';

interface Member {
  id: string;
  userId: string;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
  inviter: {
    user: {
      name: string;
    };
  };
}

interface MembersPanelProps {
  treeId: string;
}

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  owner: { label: 'Owner', icon: CrownIcon, color: 'text-amber-600' },
  admin: { label: 'Admin', icon: ShieldIcon, color: 'text-blue-600' },
  member: { label: 'Viewer', icon: EyeIcon, color: 'text-gray-500' },
  editor: { label: 'Editor', icon: ShieldIcon, color: 'text-green-600' },
  viewer: { label: 'Viewer', icon: EyeIcon, color: 'text-gray-500' },
};

export function MembersPanel({ treeId }: MembersPanelProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const { data: org } = await authClient.organization.setActive({
        organizationId: treeId,
      });

      if (!org) {
        const { data: fullOrg } = await authClient.organization.getFullOrganization({
          query: { organizationId: treeId },
        });
        if (fullOrg?.members) setMembers(fullOrg.members as unknown as Member[]);
        if (fullOrg?.invitations) setInvitations(fullOrg.invitations as unknown as Invitation[]);
      } else {
        const { data: fullOrg } = await authClient.organization.getFullOrganization({
          query: { organizationId: treeId },
        });
        if (fullOrg?.members) setMembers(fullOrg.members as unknown as Member[]);
        if (fullOrg?.invitations) setInvitations(fullOrg.invitations as unknown as Invitation[]);
      }
    } catch {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await authClient.organization.setActive({ organizationId: treeId });
      const { error } = await authClient.organization.inviteMember({
        email: inviteEmail.trim(),
        role: inviteRole as 'admin' | 'member',
      });
      if (error) throw error;
      toast.success(`Invitation sent to ${inviteEmail.trim()}`);
      setInviteEmail('');
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (_memberId: string, memberEmail: string) => {
    if (!confirm(`Remove ${memberEmail} from this tree?`)) return;
    try {
      await authClient.organization.setActive({ organizationId: treeId });
      const { error } = await authClient.organization.removeMember({
        memberIdOrEmail: memberEmail,
      });
      if (error) throw error;
      toast.success('Member removed');
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      await authClient.organization.setActive({ organizationId: treeId });
      const { error } = await authClient.organization.updateMemberRole({
        memberId,
        role: newRole,
      });
      if (error) throw error;
      toast.success('Role updated');
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await authClient.organization.setActive({ organizationId: treeId });
      const { error } = await authClient.organization.cancelInvitation({
        invitationId,
      });
      if (error) throw error;
      toast.success('Invitation cancelled');
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel invitation');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-[#7D6B3D]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlusIcon className="size-5" />
            Invite Member
          </CardTitle>
          <CardDescription>Invite someone to collaborate on this tree by email.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="border-input bg-background h-10 rounded-lg border px-3 text-sm"
              >
                <option value="admin">Editor</option>
                <option value="member">Viewer</option>
              </select>
            </div>
            <Button onClick={handleInvite} disabled={!inviteEmail.trim() || inviting}>
              {inviting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <UserPlusIcon className="mr-2 size-4" />
              )}
              Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              People who have been invited but haven't accepted yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{inv.email}</p>
                    <p className="text-muted-foreground text-xs">
                      Invited as {roleConfig[inv.role]?.label ?? inv.role}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleCancelInvitation(inv.id)}>
                    <XIcon className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>People who have access to this tree.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {members.map((member) => {
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarImage src={member.user.image ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {member.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{member.user.name}</p>
                      <p className="text-muted-foreground text-xs">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.role === 'owner' ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                        <CrownIcon className="size-3" /> Owner
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                          className="border-input bg-background h-8 rounded border px-2 text-xs"
                        >
                          <option value="admin">Editor</option>
                          <option value="member">Viewer</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id, member.user.email)}
                        >
                          <XIcon className="text-muted-foreground size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
