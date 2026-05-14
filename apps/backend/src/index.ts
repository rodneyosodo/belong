import { Elysia } from 'elysia';

const app = new Elysia().get('/', () => 'Hello Elysia').listen(5090);

// oxlint-disable-next-line no-console
console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
