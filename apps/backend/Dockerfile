FROM oven/bun:1.3-alpine AS build

WORKDIR /app

COPY apps/backend/package.json ./
RUN bun install --production

FROM oven/bun:1.3-alpine AS run

ARG VERSION
ARG REVISION
ARG CREATED

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY apps/backend/package.json ./
COPY apps/backend/src/ ./src/
COPY apps/backend/migrations/ ./migrations/
COPY apps/backend/better-auth_migrations/ ./better-auth_migrations/

LABEL org.opencontainers.image.source=https://github.com/rodneyosodo/belong
LABEL org.opencontainers.image.version=${VERSION}
LABEL org.opencontainers.image.revision=${REVISION}
LABEL org.opencontainers.image.created=${CREATED}
LABEL org.opencontainers.image.title="Belong Backend"
LABEL org.opencontainers.image.description="Backend service for Belong family tree application"
LABEL org.opencontainers.image.url=https://github.com/rodneyosodo/belong
LABEL org.opencontainers.image.documentation=https://github.com/rodneyosodo/belong
LABEL org.opencontainers.image.licenses=MIT

EXPOSE 5090

CMD ["bun", "run", "src/index.ts"]
