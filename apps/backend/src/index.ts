import { cors } from '@elysiajs/cors';
import { Elysia, Context } from 'elysia';

import { auth } from './lib/auth';

const betterAuthView = (context: Context) => {
  const BETTER_AUTH_ACCEPT_METHODS = ['POST', 'GET'];
  // validate request method
  if (BETTER_AUTH_ACCEPT_METHODS.includes(context.request.method)) {
    return auth.handler(context.request);
  } else {
    context.set.status = 405;
    return 'Method Not Allowed';
  }
};

const app = new Elysia()
  .use(
    cors({
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  )
  .all('/api/auth/*', betterAuthView)
  .get('/', () => 'Hello Elysia')
  .listen(5090);

// oxlint-disable-next-line no-console
console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
