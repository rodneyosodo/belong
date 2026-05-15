import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@workspace/ui/components/button';
import { AlertCircle } from 'lucide-react';

import { ResetPasswordForm } from '@/components/reset-password-form';

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, string | undefined>) => ({
    token: search.token ?? '',
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();

  if (!token) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-[#F5F2E9] p-8">
        <div className="flex size-14 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="size-7 text-red-600" />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <h2 className="font-['Playfair_Display'] text-xl font-semibold text-[#2D2926]">
            Invalid or missing token
          </h2>
          <p className="text-sm text-[#5E5954]">
            This password reset link is invalid or has expired.
          </p>
        </div>
        <Button
          onClick={() => useNavigate()({ to: '/forgot-password' })}
          className="h-11 rounded-lg bg-[#7D6B3D] text-sm font-semibold text-[#F5F2E9] hover:bg-[#6A5A32]"
        >
          Request a new reset link
        </Button>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
