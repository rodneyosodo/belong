import { Link } from '@tanstack/react-router';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { cn } from '@workspace/ui/lib/utils';
import {
  ArrowLeft,
  Loader2,
  LucideGitBranch,
  LucideUpload,
  LucideUsers,
  MailCheck,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { authClient } from '@/lib/auth-client';

function LeftPanel() {
  return (
    <div className="relative hidden w-1/2 flex-col items-center justify-center bg-[#2D2926] p-16 lg:flex">
      <div className="flex w-full max-w-[480px] flex-col gap-10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7D6B3D]">
              <LucideGitBranch className="size-6 text-[#F5F2E9]" />
            </div>
            <span className="font-['Playfair_Display'] text-[28px] font-semibold text-[#F5F2E9]">
              Lineage
            </span>
          </div>
          <h1 className="font-['Playfair_Display'] text-4xl leading-tight font-semibold text-[#F5F2E9]">
            Reset your password.
          </h1>
          <p className="text-base leading-relaxed text-[#8C8782]">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <Feature icon={LucideGitBranch} text="Interactive tree visualization with React Flow" />
          <Feature icon={LucideUpload} text="Import & export GEDCOM 5.5.1 files" />
          <Feature icon={LucideUsers} text="Collaborate with family members in real-time" />
        </div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-lg bg-[#3D3531]">
        <Icon className="size-[18px] text-[#7D6B3D]" />
      </div>
      <span className="text-sm text-[#A3A3A3]">{text}</span>
    </div>
  );
}

export function ForgotPasswordForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message ?? 'Something went wrong');
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className={cn('flex min-h-svh', className)} {...props}>
        <LeftPanel />
        <div className="flex flex-1 items-center justify-center bg-[#F5F2E9] p-16">
          <div className="flex w-full max-w-[400px] flex-col items-center gap-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#7D6B3D]/10">
              <MailCheck className="size-7 text-[#7D6B3D]" />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="font-['Playfair_Display'] text-[28px] font-semibold text-[#2D2926]">
                Check your email
              </h2>
              <p className="text-sm text-[#5E5954]">
                If an account with that email exists, we&apos;ve sent a password reset link.
              </p>
            </div>
            <Link
              to="/login"
              className="flex items-center gap-1.5 text-[13px] font-medium text-[#7D6B3D] hover:underline"
            >
              <ArrowLeft className="size-3.5" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex min-h-svh', className)} {...props}>
      <LeftPanel />
      <div className="flex flex-1 items-center justify-center bg-[#F5F2E9] p-16">
        <div className="flex w-full max-w-[400px] flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="font-['Playfair_Display'] text-[28px] font-semibold text-[#2D2926]">
              Forgot password?
            </h2>
            <p className="text-sm text-[#5E5954]">No worries, we&apos;ll send you a reset link.</p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-[13px] font-medium text-[#2D2926]">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
                className="h-11 rounded-lg border-[#D6D0BE] bg-white px-3 text-sm text-[#2D2926] placeholder:text-[#8C8782]"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 rounded-lg bg-[#7D6B3D] text-sm font-semibold text-[#F5F2E9] hover:bg-[#6A5A32]"
            >
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Send reset link
            </Button>
          </form>

          <p className="text-center text-[13px] text-[#5E5954]">
            Remember your password?{' '}
            <button type="button" className="font-semibold text-[#7D6B3D] hover:underline">
              <Link to="/login">Sign in</Link>
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
