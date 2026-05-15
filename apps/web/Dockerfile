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

COPY --from=build /app/apps/web/dist /usr/share/nginx/html

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

CMD ["nginx", "-g", "daemon off;"]
