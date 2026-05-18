import { cors } from '@elysiajs/cors';
import { Elysia, Context } from 'elysia';

import { auth } from './lib/auth';
import { runMigrations } from './lib/migrate';
import { personRoutes, singletonPersonRoutes } from './routes/persons';
import { treeRoutes } from './routes/trees';

const betterAuthView = (context: Context) => {
  const BETTER_AUTH_ACCEPT_METHODS = ['POST', 'GET'];
  if (BETTER_AUTH_ACCEPT_METHODS.includes(context.request.method)) {
    return auth.handler(context.request);
  } else {
    context.set.status = 405;
    return 'Method Not Allowed';
  }
};

const start = async () => {
  console.log('Running migrations...');
  await runMigrations();
  console.log('Migrations complete.');

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
    .use(treeRoutes)
    .use(personRoutes)
    .use(singletonPersonRoutes)
    .post('/api/upload/avatar', async (context) => {
      const formData = await context.request.formData();
      const file = formData.get('file');

      if (!file || !(file instanceof File)) {
        context.set.status = 400;
        return { error: 'No file provided' };
      }

      if (!file.type.startsWith('image/')) {
        context.set.status = 400;
        return { error: 'File must be an image' };
      }

      if (file.size > 5 * 1024 * 1024) {
        context.set.status = 400;
        return { error: 'File must be under 5MB' };
      }

      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;

      const session = await auth.api.getSession({
        headers: context.request.headers,
      });

      if (!session?.user?.id) {
        context.set.status = 401;
        return { error: 'Unauthorized' };
      }

      await auth.api.updateUser({
        body: { image: dataUrl },
        headers: context.request.headers,
      });

      return { success: true };
    })
    .post('/api/upload/cover', async (context) => {
      const formData = await context.request.formData();
      const file = formData.get('file');
      const treeId = formData.get('treeId');

      if (!file || !(file instanceof File)) {
        context.set.status = 400;
        return { error: 'No file provided' };
      }

      if (!file.type.startsWith('image/')) {
        context.set.status = 400;
        return { error: 'File must be an image' };
      }

      if (file.size > 5 * 1024 * 1024) {
        context.set.status = 400;
        return { error: 'File must be under 5MB' };
      }

      if (!treeId || typeof treeId !== 'string') {
        context.set.status = 400;
        return { error: 'treeId is required' };
      }

      const session = await auth.api.getSession({
        headers: context.request.headers,
      });

      if (!session?.user?.id) {
        context.set.status = 401;
        return { error: 'Unauthorized' };
      }

      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;

      await auth.api.updateOrganization({
        body: {
          organizationId: treeId,
          data: { coverImage: dataUrl },
        },
        headers: context.request.headers,
      });

      return { success: true, cover_image: dataUrl };
    })
    .get('/', () => 'Hello Elysia')
    .listen(5090);

  console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
};

start();
