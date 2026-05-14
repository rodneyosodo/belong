import { usernameClient } from 'better-auth/client/plugins';
import { anonymousClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: (Bun.env.BELONG_BACKEND_URL as string) || 'http://localhost:5090',
  plugins: [usernameClient(), anonymousClient()],
  socialProviders: {
    google: {
      clientId: Bun.env.BELONG_GOOGLE_CLIENT_ID as string,
      clientSecret: Bun.env.BELONG_GOOGLE_CLIENT_SECRET as string,
    },
  },
});

export const { signIn, signUp, useSession } = createAuthClient();
