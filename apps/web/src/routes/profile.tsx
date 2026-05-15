import { createFileRoute } from '@tanstack/react-router';

import { ProfileForm } from '@/components/profile-form';

export const Route = createFileRoute('/profile')({
  component: ProfileForm,
});
