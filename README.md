# Belong

A self-hosted family tree application. Build, visualize, and share your family tree with support for GEDCOM import/export, multiple relationship types, and collaboration.

## Features

- **Visual tree editor** — drag-and-drop canvas with auto-layout (vertical, horizontal, free-form)
- **Relationship types** — biological, adopted, step-parent/child, half-sibling, spouse/partner
- **GEDCOM support** — import and export GEDCOM 5.5.1 files with preview
- **Export** — PNG, PDF, GEDCOM export
- **Collaboration** — invite members with owner/editor/viewer roles
- **Auth** — email/password, Google OAuth, GitHub OAuth
- **Responsive** — works on desktop and mobile

## Quick Start (Docker)

### 1. Clone the repository

```bash
git clone https://github.com/rodneyosodo/belong.git
cd belong
```

### 2. Create environment file

```bash
cp example.env .env
```

Edit `.env` with your configuration. See [Configuration](#configuration) for details.

At minimum, generate a new `BETTER_AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 3. Start the services

```bash
bun run docker:up
```

Or with docker compose directly:

```bash
docker compose -f docker-compose.yml --env-file .env up -d
```

### 4. Access the application

| Service     | URL                   |
| ----------- | --------------------- |
| Web UI      | http://localhost:5091 |
| Backend API | http://localhost:5090 |

## Development

### Prerequisites

- [Bun](https://bun.sh/) >= 1.3
- [Docker](https://www.docker.com/) (for PostgreSQL)

### 1. Start the database

```bash
cd apps/backend
docker compose -f compose-dev.yaml up -d
```

### 2. Install dependencies

```bash
bun install
```

### 3. Set up environment variables

Create `apps/web/.env`:

```
BELONG_BACKEND_URL=http://localhost:5090
```

Create `apps/backend/.env` (use `example.env` as reference):

```
BETTER_AUTH_SECRET=<your-secret>
BETTER_AUTH_URL=http://localhost:5090
BELONG_DB_USER=belong
BELONG_DB_PASS=belong
BELONG_DB_NAME=belong
BELONG_DB_URI=postgresql://belong:belong@localhost:5432/belong
BELONG_FRONTEND_URL=http://localhost:5091
BELONG_BACKEND_URL=http://localhost:5090
```

### 4. Run migrations

```bash
cd apps/backend
bun run src/bin/migrate.ts
```

### 5. Start dev servers

```bash
bun run dev
```

This starts both the frontend (port 5091) and backend (port 5090) with hot reload.

## Docker Deployment

### Building images

```bash
# Build latest
bun run docker:build

# Build versioned release
bun run docker:build:release
```

### Stopping services

```bash
bun run docker:down
```

### OAuth Setup

#### Google

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 credentials
3. Add redirect URI: `<BELONG_BACKEND_URL>/api/auth/callback/google`

#### GitHub

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set callback URL: `<BELONG_BACKEND_URL>/api/auth/callback/github`

## License

[MIT](LICENSE)
