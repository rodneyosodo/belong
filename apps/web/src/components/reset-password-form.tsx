import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { cn } from '@workspace/ui/lib/utils';
import { Eye, EyeOff, Loader2, LucideGitBranch, LucideUpload, LucideUsers } from 'lucide-react';
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
            Set a new password.
          </h1>
          <p className="text-base leading-relaxed text-[#8C8782]">
            Choose a strong password you haven&apos;t used before.
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

export function ResetPasswordForm({
  token,
  className,
  ...props
}: React.ComponentProps<'div'> & { token: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get('password') as string;
    const confirmPassword = formData.get('confirm-password') as string;

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    const { error } = await authClient.resetPassword({
      newPassword,
      token,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message ?? 'Failed to reset password');
      return;
    }

    toast.success('Password reset successfully');
    navigate({ to: '/login' });
  };

  return (
    <div className={cn('flex min-h-svh', className)} {...props}>
      <LeftPanel />
      <div className="flex flex-1 items-center justify-center bg-[#F5F2E9] p-16">
        <div className="flex w-full max-w-[400px] flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="font-['Playfair_Display'] text-[28px] font-semibold text-[#2D2926]">
              Set new password
            </h2>
            <p className="text-sm text-[#5E5954]">
              Must be at least 8 characters.
            </p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-[13px] font-medium text-[#2D2926]">
                New password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  className="h-11 rounded-lg border-[#D6D0BE] bg-white px-3 pr-10 text-sm text-[#2D2926] placeholder:text-[#8C8782]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-[#8C8782] hover:text-[#2D2926]"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm-password" className="text-[13px] font-medium text-[#2D2926]">
                Confirm new password
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  minLength={8}
                  className="h-11 rounded-lg border-[#D6D0BE] bg-white px-3 pr-10 text-sm text-[#2D2926] placeholder:text-[#8C8782]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-[#8C8782] hover:text-[#2D2926]"
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 rounded-lg bg-[#7D6B3D] text-sm font-semibold text-[#F5F2E9] hover:bg-[#6A5A32]"
            >
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Reset password
            </Button>
          </form>

          <p className="text-center text-[13px] text-[#5E5954]">
            <Link to="/login" className="font-semibold text-[#7D6B3D] hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
