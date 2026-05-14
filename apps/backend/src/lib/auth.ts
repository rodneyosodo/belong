import { betterAuth } from 'better-auth';
import { username } from 'better-auth/plugins';
import { anonymous } from 'better-auth/plugins';
import { bearer } from 'better-auth/plugins';
import { Pool } from 'pg';

export const auth = betterAuth({
  baseURL: (Bun.env.BETTER_AUTH_URL as string) || 'http://localhost:5090',
  database: new Pool({
    connectionString:
      (Bun.env.BELONG_DB_URI as string) || 'postgresql://belong:belong@localhost:5432/belong',
  }),
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
