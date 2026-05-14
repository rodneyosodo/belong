import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Separator } from '@workspace/ui/components/separator';
import { cn } from '@workspace/ui/lib/utils';
import { Eye, EyeOff, Loader2, LucideGitBranch, LucideUpload, LucideUsers } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { signIn } from '@/lib/auth-client';

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
            Map your family story.
          </h1>
          <p className="text-base leading-relaxed text-[#8C8782]">
            Build, visualize, and share your family tree with Lineage. Import GEDCOM files,
            collaborate with relatives, and preserve your heritage for generations to come.
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

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error: authError } = await signIn.email({ email, password });

    setLoading(false);

    if (authError) {
      toast.error(authError.message ?? 'Invalid email or password');
      return;
    }

    navigate({ to: '/' });
  };

  return (
    <div className={cn('flex min-h-svh', className)} {...props}>
      <LeftPanel />
      <div className="flex flex-1 items-center justify-center bg-[#F5F2E9] p-16">
        <div className="flex w-full max-w-[400px] flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="font-['Playfair_Display'] text-[28px] font-semibold text-[#2D2926]">
              Welcome back
            </h2>
            <p className="text-sm text-[#5E5954]">Sign in to your Lineage account</p>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-[#D6D0BE] bg-white text-sm font-medium text-[#2D2926] transition-colors hover:bg-[#EDEADE]"
            >
              <span className="text-base font-bold text-[#4285F4]">G</span>
              Continue with Google
            </button>
            <button
              type="button"
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-[#D6D0BE] bg-white text-sm font-medium text-[#2D2926] transition-colors hover:bg-[#EDEADE]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-[18px]">
                <path
                  d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                  fill="currentColor"
                />
              </svg>
              Continue with GitHub
            </button>
          </div>

          <div className="flex items-center gap-4">
            <Separator className="flex-1 bg-[#D6D0BE]" />
            <span className="text-xs text-[#8C8782]">or</span>
            <Separator className="flex-1 bg-[#D6D0BE]" />
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-[13px] font-medium text-[#2D2926]">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
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
            <div className="flex justify-end">
              <a href="#" className="text-[13px] font-medium text-[#7D6B3D] hover:underline">
                Forgot password?
              </a>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 rounded-lg bg-[#7D6B3D] text-sm font-semibold text-[#F5F2E9] hover:bg-[#6A5A32]"
            >
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          <p className="text-center text-[13px] text-[#5E5954]">
            Don&apos;t have an account?{' '}
            <button type="button" className="font-semibold text-[#7D6B3D] hover:underline">
              <Link to="/signup">Sign up</Link>
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
