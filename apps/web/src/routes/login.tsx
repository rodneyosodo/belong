import { createRoute } from '@tanstack/react-router';

import { LoginForm } from '@/components/login-form';

import { rootRoute } from './__root';

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginForm,
});
