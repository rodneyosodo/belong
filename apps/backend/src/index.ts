import { cors } from "@elysiajs/cors";
import { Elysia, Context } from "elysia";

import { auth } from "./lib/auth";
import { runMigrations } from "./lib/migrate";

const betterAuthView = (context: Context) => {
  const BETTER_AUTH_ACCEPT_METHODS = ["POST", "GET"];
  // validate request method
  if (BETTER_AUTH_ACCEPT_METHODS.includes(context.request.method)) {
    return auth.handler(context.request);
  } else {
    context.set.status = 405;
    return "Method Not Allowed";
  }
};

const start = async () => {
  console.log("Running migrations...");
  await runMigrations();
  console.log("Migrations complete.");

  const app = new Elysia()
    .use(
      cors({
        origin: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
      }),
    )
    .all("/api/auth/*", betterAuthView)
    .get("/", () => "Hello Elysia")
    .listen(5090);

  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
  );
};

start();
