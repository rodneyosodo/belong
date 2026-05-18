# Family Tree Application — Roadmap

## Tech Stack

| Layer              | Technology                                                              |
| ------------------ | ----------------------------------------------------------------------- |
| Monorepo           | Turborepo + bun                                                         |
| Frontend           | Vite + React 19 + TanStack Router + Tailwind v4                         |
| UI                 | shadcn/ui (base-nova), Base UI, Lucide                                  |
| Tree Visualization | React Flow (xyflow) + Dagre                                             |
| Backend            | Elysia.js (Bun HTTP framework)                                          |
| Auth               | Better Auth (email/password, Google/GitHub OAuth, organizations plugin) |
| Database           | PostgreSQL via `pg` (node-postgres)                                     |
| Email              | Nodemailer (SMTP — password reset, invitations)                         |
| Deployment         | Docker (self-hosted)                                                    |

## Phase 1: Project Setup & Foundation

- [x] Scaffold monorepo with Turborepo, bun workspaces (apps/web, apps/backend, packages/ui)
- [x] Initialize Vite + React + TypeScript + TanStack Router + Tailwind CSS v4
- [x] Initialize shadcn/ui and install base components (Button, Card, Dialog, Tabs, Dropdown, Sheet, Avatar, Sidebar, Breadcrumb, Field, etc.)
  - Form system provided by `field` component (Field, FieldGroup, FieldLabel, FieldDescription, FieldError) — base-ui equivalent of shadcn Form
- [x] Set up domain database tables via raw SQL / migration files:
  - `persons` — id, organization_id, first_name, last_name, gender, birth_date, death_date, bio, avatar_url, is_deceased, metadata (JSONB)
  - `relationships` — id, organization_id, person_a_id, person_b_id, type, metadata (JSONB)
  - Trees modeled as Better Auth organizations with extended fields (description, coverImage, isPublic)
- [x] Better Auth with email/password + Google + GitHub OAuth (backend + client)
- [x] Docker compose for PostgreSQL (compose-dev.yaml)
- [x] Dockerfile for backend (apps/backend/Dockerfile)
- [x] Dockerfile for web (apps/web/Dockerfile)
- [x] docker-compose.yml for full-stack deployment

## Phase 2: Authentication & User Management

- [x] Auth pages: Sign in, Sign up
- [x] Forgot password flow (forgot-password page, reset-password page, SMTP email via Nodemailer)
- [x] Better Auth client setup with session management
- [x] Auth middleware — auth guard on root route, redirect unauthenticated users, public routes for tree/person views
- [x] User profile page — edit name, avatar upload, change password, theme toggle, sign out

## Phase 3: Tree CRUD & Dashboard

- [x] Dashboard page — tree listing (owned + shared trees from API)
- [x] New tree dialog — create from scratch or import GEDCOM
- [x] Backend API endpoints for tree CRUD (list, get, create, update, delete via `/api/trees`)
- [x] Connect dashboard to real API data
- [x] Tree settings page — name, description, cover image upload, visibility toggle, delete
- [x] Collaboration system (powered by Better Auth organizations):
  - [x] Invite members by email
  - [x] Assign roles: owner / admin (editor) / member (viewer)
  - [x] Manage members list — view, update role, remove
  - [x] Accept/decline invitations (dedicated invitation page)
  - [x] Cancel pending invitations
  - [x] Invitation emails via SMTP

## Phase 4: Visual Tree Editor (Core Feature)

- [x] React Flow canvas with custom family node type
- [x] Custom person nodes — display photo, name, birth/death years, gender icon
- [x] Custom relationship edges
- [x] Dagre auto-layout (top-down direction)
- [x] Add person dialog — form with fields (name, dates, gender, bio, photo, relationship type)
- [x] Node context menu — add spouse, add child, add parent, add sibling, edit, delete, view
- [x] Zoom, pan, fit-to-view controls
- [x] Mini-map for navigation
- [x] Layout modes:
  - [x] Top-down auto-layout via Dagre
  - [x] Left-to-right (horizontal) layout
  - [x] Free-form manual drag
- [x] Edit person — context menu opens edit dialog with full form
- [x] Delete person/relationship — with confirmation dialog showing relationship count
- [x] Undo/redo support (Ctrl+Z / Ctrl+Shift+Z, history hook with undo/redo stack)
- [x] Stats panel — member count, living count, generation count
- [x] Add member button, export GEDCOM, share link, import link in toolbar

## Phase 5: Member Profiles

- [x] Person detail page — route `/person/$id` with full profile display
- [x] Profile fields: name, gender, birth/death dates, bio, photo
- [x] Family relations panel — spouse, parents, children, siblings
- [x] Life timeline — birth/death events
- [x] Photo upload — avatar/photo storage for persons (file upload via /api/upload/person-photo)
- [x] Edit profile form (edit-person-dialog with all fields)
- [x] Timeline view — marriage, custom events (person_events table, timeline with birth/death/marriage/custom)

## Phase 6: Relationship Types

- [x] Parent → Child (biological)
- [x] Spouse / Partner
- [x] Sibling (via shared parent edges — adds child relationships from same parents)
- [x] Adopted parent → Adopted child
- [x] Step-parent → Step-child
- [x] Half-sibling
- [x] Relationship constraints — prevent invalid relationships (frontend + backend validation)
- [x] Visual distinction — different edge styles/colors per type:
  - Spouse: solid gold (#7D6B3D)
  - Parent/Child: solid gray (#5E5954)
  - Adopted: blue dashed (#2563EB)
  - Step-parent/Step-child: purple dotted (#9333EA)
  - Sibling: green dashed (#16A34A)
  - Half-sibling: amber dotted (#D97706)
- [x] Layout persistence — save/load tree layout (mode + node positions) per tree in DB (`tree_layouts` table)
  - Each layout mode (TB/LR/FREE) has independently saved positions
  - Switching between modes restores the previous layout for that mode
  - Drag positions in FREE mode auto-persist

## Phase 7: Search & Navigation

- [ ] Global search — search persons across all trees by name
- [ ] In-tree search — find and highlight a specific person
- [ ] Breadcrumb navigation — navigate through ancestor/descendant chains
- [ ] Person quick-jump — dropdown list, click to center on person

## Phase 8: GEDCOM Import/Export

- [x] GEDCOM parser — import `.ged` files, convert to persons + relationships
- [x] GEDCOM exporter — export tree data to GEDCOM 5.5.1 format
- [x] Import page with file upload, error handling, success summary
- [x] Server-side import with transaction (rollback on failure)
- [x] Import preview — show what will be imported before committing
- [x] Error handling — handle malformed GEDCOM files gracefully

## Phase 9: Export & Sharing

- [x] Export as PNG/SVG — screenshot the tree canvas as an image
- [x] Export as PDF — print-ready family tree document
- [x] Share via link — generate public/protected link
- [x] Embed code — iframe embed for external sites

## Phase 10: Polish & Optimization

- [x] Dark/light theme toggle (next-themes ThemeProvider)
- [x] Toast notifications (sonner)
- [x] Sidebar navigation with collapsible sections
- [ ] Responsive design — mobile-friendly tree viewer (touch pan/zoom)
- [ ] Performance optimization — virtualized rendering for 500+ person trees
- [ ] Error boundaries
- [ ] Loading states — skeletons, spinners (partial — some routes have loading spinners)
- [ ] Empty states — helpful onboarding for new trees

## Phase 11: Docker & Deployment

- [x] Dockerfile for backend (Elysia/Bun)
- [x] Dockerfile for web (Vite static build + nginx)
- [x] docker-compose.yml — backend + web + PostgreSQL
- [x] Environment variables — documented `example.env` with all config vars
- [x] README — setup instructions for Docker deployment
