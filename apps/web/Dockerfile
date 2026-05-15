FROM oven/bun:1.3 AS build

WORKDIR /app

COPY package.json turbo.json tsconfig.json ./
COPY apps/web/package.json apps/web/tsconfig*.json apps/web/vite.config.ts apps/web/index.html ./apps/web/
COPY packages/ui/package.json packages/ui/tsconfig*.json ./packages/ui/

RUN bun install

COPY apps/web/ ./apps/web/
COPY packages/ui/ ./packages/ui/

RUN bun run --cwd apps/web build

FROM nginx:1.27-alpine AS run

ARG VERSION
ARG REVISION
ARG CREATED

COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/env.js.template /usr/share/nginx/html/env.js.template
COPY apps/web/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

LABEL org.opencontainers.image.source=https://github.com/rodneyosodo/belong
LABEL org.opencontainers.image.version=${VERSION}
LABEL org.opencontainers.image.revision=${REVISION}
LABEL org.opencontainers.image.created=${CREATED}
LABEL org.opencontainers.image.title="Belong Web"
LABEL org.opencontainers.image.description="Web frontend for Belong family tree application"
LABEL org.opencontainers.image.url=https://github.com/rodneyosodo/belong
LABEL org.opencontainers.image.documentation=https://github.com/rodneyosodo/belong
LABEL org.opencontainers.image.licenses=MIT

COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen       5091;
    server_name  localhost;

    root   /usr/share/nginx/html;
    index  index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /env.js {
        add_header Cache-Control "no-cache";
    }
}
EOF

EXPOSE 5091

ENTRYPOINT ["/entrypoint.sh"]
