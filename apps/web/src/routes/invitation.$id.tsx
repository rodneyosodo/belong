import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Loader2, CheckCircleIcon, XCircleIcon, MailIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { authClient } from '@/lib/auth-client';

export const Route = createFileRoute('/invitation/$id')({
  component: InvitationPage,
});

interface InvitationData {
  id: string;
  email: string;
  role: string;
  status: string;
  organizationId: string;
  organization: {
    name: string;
    slug: string;
  };
  inviter: {
    user: {
      name: string;
    };
  };
  expiresAt: Date;
}

function InvitationPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [responded, setResponded] = useState<'accepted' | 'declined' | null>(null);

  useEffect(() => {
    async function load() {
      const { data: session } = authClient.useSession();
      if (!session) {
        navigate({ to: '/login' });
        return;
      }

      try {
        const { data, error } = await authClient.organization.getInvitation({
          query: { id },
        });
        if (error || !data) {
          toast.error('Invitation not found');
          navigate({ to: '/' });
          return;
        }
        setInvitation(data as unknown as InvitationData);
      } catch {
        toast.error('Failed to load invitation');
        navigate({ to: '/' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, navigate]);

  const handleAccept = async () => {
    setResponding(true);
    try {
      const { error } = await authClient.organization.acceptInvitation({
        invitationId: id,
      });
      if (error) throw error;
      setResponded('accepted');
      toast.success('Invitation accepted!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setResponding(false);
    }
  };

  const handleDecline = async () => {
    setResponding(true);
    try {
      const { error } = await authClient.organization.rejectInvitation({
        invitationId: id,
      });
      if (error) throw error;
      setResponded('declined');
      toast.success('Invitation declined');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to decline invitation');
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F2E9]">
        <Loader2 className="size-8 animate-spin text-[#7D6B3D]" />
      </div>
    );
  }

  if (responded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F2E9] p-4">
        <Card className="w-full max-w-md border-[#D6D0BE]">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            {responded === 'accepted' ? (
              <>
                <CheckCircleIcon className="size-12 text-green-500" />
                <h2 className="font-['Playfair_Display'] text-xl font-semibold text-[#2D2926]">
                  Invitation Accepted!
                </h2>
                <p className="text-center text-sm text-[#5E5954]">
                  You have joined "{invitation?.organization.name}".
                </p>
                <Button onClick={() => navigate({ to: '/' })}>Go to Dashboard</Button>
              </>
            ) : (
              <>
                <XCircleIcon className="size-12 text-gray-400" />
                <h2 className="font-['Playfair_Display'] text-xl font-semibold text-[#2D2926]">
                  Invitation Declined
                </h2>
                <Button onClick={() => navigate({ to: '/' })}>Go to Dashboard</Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F2E9] p-4">
      <Card className="w-full max-w-md border-[#D6D0BE]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-[#E8E4D8]">
            <MailIcon className="size-6 text-[#7D6B3D]" />
          </div>
          <CardTitle className="font-['Playfair_Display'] text-xl text-[#2D2926]">
            Tree Invitation
          </CardTitle>
          <CardDescription>
            {invitation?.inviter?.user?.name ?? 'Someone'} has invited you to join
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-lg font-semibold text-[#2D2926]">
            {invitation?.organization?.name ?? 'a family tree'}
          </p>
          <p className="text-sm text-[#5E5954]">
            Role:{' '}
            <span className="font-medium">
              {invitation?.role === 'admin'
                ? 'Editor'
                : invitation?.role === 'member'
                  ? 'Viewer'
                  : invitation?.role}
            </span>
          </p>
          <div className="mt-4 flex gap-3">
            <Button variant="outline" onClick={handleDecline} disabled={responding}>
              {responding && <Loader2 className="mr-2 size-4 animate-spin" />}
              Decline
            </Button>
            <Button
              onClick={handleAccept}
              disabled={responding}
              className="bg-[#7D6B3D] hover:bg-[#6A5A32]"
            >
              {responding && <Loader2 className="mr-2 size-4 animate-spin" />}
              Accept
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
