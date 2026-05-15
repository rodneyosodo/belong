FROM oven/bun:1.3 AS build

WORKDIR /app

COPY apps/backend/package.json ./
RUN bun install --production

FROM oven/bun:1.3 AS run

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY apps/backend/package.json ./
COPY apps/backend/src/ ./src/
COPY apps/backend/migrations/ ./migrations/
COPY apps/backend/better-auth_migrations/ ./better-auth_migrations/

EXPOSE 5090

CMD ["bun", "run", "src/index.ts"]
