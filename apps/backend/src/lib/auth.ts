import { betterAuth } from 'better-auth';
import { username } from 'better-auth/plugins';
import { anonymous } from 'better-auth/plugins';
import { bearer } from 'better-auth/plugins';

import { pool } from './db';

export const auth = betterAuth({
  baseURL: (Bun.env.BETTER_AUTH_URL as string) || 'http://localhost:5090',
  trustedOrigins: [(Bun.env.BELONG_FRONTEND_URL as string) || 'http://localhost:5091'],
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [username(), anonymous(), bearer()],
  socialProviders: {
    google: {
      clientId: Bun.env.BELONG_GOOGLE_CLIENT_ID as string,
      clientSecret: Bun.env.BELONG_GOOGLE_CLIENT_SECRET as string,
    },
  },
});
