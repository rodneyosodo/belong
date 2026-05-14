import { createRoute } from '@tanstack/react-router';

import { SignupForm } from '@/components/signup-form';

import { rootRoute } from './__root';

export const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  component: SignupForm,
});
