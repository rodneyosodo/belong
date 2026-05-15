import { redirect } from '@tanstack/react-router';

import { env } from './env';

const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];
const publicRoutes = authRoutes;

export interface SessionData {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
  } | null;
  session: {
    id: string;
    userId: string;
  } | null;
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const res = await fetch(`${env.BELONG_BACKEND_URL}/api/auth/get-session`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function isPublicRoute(pathname: string): boolean {
  return publicRoutes.includes(pathname);
}

export function isAuthRoute(pathname: string): boolean {
  return authRoutes.includes(pathname);
}

export async function authGuard({ location }: { location: { pathname: string } }) {
  const session = await getSession();

  if (session && isAuthRoute(location.pathname)) {
    throw redirect({ to: '/' });
  }

  if (!session && !isPublicRoute(location.pathname)) {
    throw redirect({ to: '/login' });
  }
}
