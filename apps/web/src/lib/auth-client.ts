import { anonymousClient, usernameClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import { env } from './env';

export const authClient = createAuthClient({
  baseURL: env.BELONG_BACKEND_URL,
  plugins: [usernameClient(), anonymousClient()],
});

export const { signIn, signUp, useSession } = authClient;
