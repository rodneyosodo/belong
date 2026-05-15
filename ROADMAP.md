# Family Tree Application — Roadmap

## Tech Stack

| Layer              | Technology                                        |
| ------------------ | ------------------------------------------------- |
| Monorepo           | Turborepo + bun                                   |
| Frontend           | Vite + React 19 + TanStack Router + Tailwind v4   |
| UI                 | shadcn/ui (base-nova), Base UI, Lucide            |
| Tree Visualization | React Flow (xyflow) + Dagre                       |
| Backend            | Elysia.js (Bun HTTP framework)                    |
| Auth               | Better Auth (email/password, Google OAuth)        |
| Database           | PostgreSQL via `pg` (node-postgres)               |
| Deployment         | Docker (self-hosted)                               |

## Phase 1: Project Setup & Foundation

- [x] Scaffold monorepo with Turborepo, bun workspaces (apps/web, apps/backend, packages/ui)
- [x] Initialize Vite + React + TypeScript + TanStack Router + Tailwind CSS v4
- [x] Initialize shadcn/ui and install base components (Button, Card, Dialog, Tabs, Dropdown, Sheet, Avatar, Sidebar, Breadcrumb, etc.)
- [ ] Add shadcn/ui Form component
- [ ] Set up domain database tables via raw SQL / migration files:
  - `trees` — id, owner_id, name, description, cover_image, is_public, created_at, updated_at
  - `tree_members` — id, tree_id, user_id, role (owner/editor/viewer)
  - `persons` — id, tree_id, first_name, last_name, gender, birth_date, death_date, bio, avatar_url, is_deceased, metadata (JSON)
  - `relationships` — id, tree_id, person_a_id, person_b_id, type (parent/child/spouse/sibling/adopted/step-parent/step-child), metadata (JSON)
- [x] Better Auth with email/password + Google OAuth (backend + client)
- [ ] Add GitHub OAuth provider to Better Auth
- [x] Docker compose for PostgreSQL (compose-dev.yaml)
- [ ] Create Dockerfile for backend + web production builds
- [ ] Create docker-compose.yml for full-stack deployment

## Phase 2: Authentication & User Management

- [x] Auth pages: Sign in, Sign up
- [ ] Forgot password flow
- [ ] Email verification
- [x] Better Auth client setup with session management
- [ ] Auth middleware — protect routes, redirect unauthenticated users
- [ ] User profile page — edit name, avatar, change password

## Phase 3: Tree CRUD & Dashboard

- [x] Dashboard page — tree listing (hardcoded mock data)
- [x] New tree dialog — create from scratch or import GEDCOM
- [ ] Backend API endpoints for tree CRUD
- [ ] Connect dashboard to real API data
- [ ] Tree settings page — name, description, cover image, visibility
- [ ] Collaboration system:
  - [ ] Invite members by email
  - [ ] Assign roles: owner / editor / viewer
  - [ ] Manage members list
  - [ ] Accept/decline invitations

## Phase 4: Visual Tree Editor (Core Feature)

- [x] React Flow canvas with custom family node type
- [x] Custom person nodes — display photo, name, birth/death years, gender icon
- [x] Custom relationship edges
- [x] Dagre auto-layout (top-down direction)
- [x] Add person dialog — form with fields (name, dates, gender, bio, photo)
- [x] Node context menu — add spouse, add child, add sibling, edit, delete
- [x] Zoom, pan, fit-to-view controls
- [x] Mini-map for navigation
- [x] Layout modes:
  - [x] Top-down auto-layout via Dagre
  - [ ] Left-to-right (horizontal) layout
  - [ ] Free-form manual drag
- [ ] Edit person — click node to open profile editor
- [ ] Delete person/relationship — with confirmation
- [ ] Undo/redo support

## Phase 5: Member Profiles

- [x] Person detail page — route `/person/$id` with full profile display
- [x] Profile fields: name, gender, birth/death dates, bio, photo
- [x] Family relations panel — spouse, parents, children, siblings
- [x] Life timeline — birth/death events
- [ ] Photo upload — avatar/photo storage
- [ ] Edit profile form
- [ ] Timeline view — marriage, custom events

## Phase 6: Relationship Types

- [x] Parent → Child (biological)
- [x] Spouse / Partner
- [ ] Sibling (via shared parent edges)
- [ ] Adopted parent → Adopted child
- [ ] Step-parent → Step-child
- [ ] Half-sibling
- [ ] Relationship constraints — prevent invalid relationships
- [ ] Visual distinction — different edge styles/colors per type

## Phase 7: Search & Navigation

- [ ] Global search — search persons across all trees by name
- [ ] In-tree search — find and highlight a specific person
- [ ] Breadcrumb navigation — navigate through ancestor/descendant chains
- [ ] Person quick-jump — dropdown list, click to center on person

## Phase 8: GEDCOM Import/Export

- [x] GEDCOM parser — import `.ged` files, convert to persons + relationships
- [x] GEDCOM exporter — export tree data to GEDCOM 5.5.1 format
- [x] Import page with file upload, error handling, success summary
- [ ] Import preview — show what will be imported before committing
- [ ] Error handling — handle malformed GEDCOM files gracefully

## Phase 9: Export & Sharing

- [ ] Export as PNG/SVG — screenshot the tree canvas as an image
- [ ] Export as PDF — print-ready family tree document
- [ ] Share via link — generate public/protected link
- [ ] Embed code — iframe embed for external sites

## Phase 10: Polish & Optimization

- [x] Dark/light theme toggle (next-themes ThemeProvider)
- [x] Toast notifications (sonner)
- [x] Sidebar navigation with collapsible sections
- [ ] Responsive design — mobile-friendly tree viewer (touch pan/zoom)
- [ ] Performance optimization — virtualized rendering for 500+ person trees
- [ ] Error boundaries
- [ ] Loading states — skeletons, spinners
- [ ] Empty states — helpful onboarding for new trees

## Phase 11: Docker & Deployment

- [ ] Dockerfile for backend (Elysia/Bun)
- [ ] Dockerfile for web (Vite static build + nginx)
- [ ] docker-compose.yml — backend + web + PostgreSQL
- [ ] Environment variables — documented `.env.example`
- [ ] README — setup instructions for Docker deployment

## Project Structure

```
belong/
├── apps/
│   ├── web/                        # Vite + React + TanStack Router
│   │   ├── src/
│   │   │   ├── components/         # App components (family tree, dialogs, sidebar, forms)
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   ├── lib/                # Auth client, env config
│   │   │   ├── routes/             # TanStack Router route files
│   │   │   ├── main.tsx            # App entry point
│   │   │   └── routeTree.gen.ts    # Auto-generated route tree
│   │   ├── index.html
│   │   └── vite.config.ts
│   └── backend/                    # Elysia.js + Better Auth
│       ├── src/
│       │   ├── index.ts            # Elysia server entry
│       │   └── lib/
│       │       └── auth.ts         # Better Auth config
│       ├── better-auth_migrations/ # Auth table migrations
│       └── compose-dev.yaml        # PostgreSQL dev container
├── packages/
│   └── ui/                         # Shared shadcn/ui components
│       ├── src/
│       │   ├── components/         # Button, Card, Dialog, Input, Tabs, etc.
│       │   ├── hooks/
│       │   ├── lib/
│       │   └── styles/
│       │       └── globals.css     # Tailwind v4 global styles + CSS vars
│       └── components.json
├── package.json                    # Turborepo root
├── turbo.json
└── tsconfig.json
```
