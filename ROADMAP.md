# Family Tree Application — Roadmap

## Tech Stack

| Layer              | Technology                           |
| ------------------ | ------------------------------------ |
| Framework          | Next.js 15 (App Router)              |
| Frontend           | React 19, shadcn/ui, Tailwind CSS v4 |
| Tree Visualization | React Flow                           |
| Auth               | Better Auth                          |
| Database           | SQLite via Drizzle ORM               |
| Deployment         | Vercel (demo) + Docker (self-hosted) |

## Phase 1: Project Setup & Foundation

- [ ] Scaffold Next.js project with App Router, TypeScript, Tailwind CSS
- [ ] Initialize shadcn/ui and install base components (Button, Card, Dialog, Form, Input, Tabs, Dropdown, Sheet, Avatar)
- [ ] Set up Drizzle ORM with SQLite schema:
  - `users` — id, email, name, avatar, created_at
  - `trees` — id, owner_id, name, description, cover_image, is_public, created_at, updated_at
  - `tree_members` — id, tree_id, user_id, role (owner/editor/viewer)
  - `persons` — id, tree_id, first_name, last_name, gender, birth_date, death_date, bio, avatar_url, is_deceased, metadata (JSON)
  - `relationships` — id, tree_id, person_a_id, person_b_id, type (parent/child/spouse/sibling/adopted/step-parent/step-child), metadata (JSON)
- [ ] Set up Better Auth with email/password + social providers (Google, GitHub)
- [ ] Docker setup — Dockerfile + docker-compose.yml with SQLite volume mount

## Phase 2: Authentication & User Management

- [ ] Auth pages: Sign up, Sign in, Forgot password, Email verification
- [ ] Auth middleware — protect routes, redirect unauthenticated users
- [ ] User profile page — edit name, avatar, change password
- [ ] Session management — JWT sessions, secure cookies

## Phase 3: Tree CRUD & Dashboard

- [ ] Dashboard page — list user's trees, create new tree, delete, duplicate
- [ ] Tree settings page — name, description, cover image, visibility (public/private)
- [ ] Collaboration system:
  - [ ] Invite members by email
  - [ ] Assign roles: owner / editor / viewer
  - [ ] Manage members list
  - [ ] Accept/decline invitations

## Phase 4: Visual Tree Editor (Core Feature)

- [ ] React Flow canvas with custom node/edge types for family members
- [ ] Custom person nodes — display photo, name, birth/death years, gender icon
- [ ] Custom relationship edges — color-coded by type (parent=blue, spouse=red, sibling=green)
- [ ] Layout modes:
  - [ ] Top-down — ancestors at top, descendants below
  - [ ] Left-to-right — horizontal layout
  - [ ] Free-form — drag nodes freely
  - [ ] Auto-layout toggle (switch between structured and free-form)
- [ ] Add person — click to add, form dialog with fields (name, dates, gender, bio, photo)
- [ ] Add relationship — drag from node to node, select relationship type
- [ ] Edit person — click node to open detail panel/profile editor
- [ ] Delete person/relationship — with confirmation
- [ ] Zoom, pan, fit-to-view controls
- [ ] Mini-map for navigation on large trees
- [ ] Undo/redo support

## Phase 5: Member Profiles

- [ ] Person detail panel — slide-out sidebar or modal with full profile
- [ ] Profile fields: first/last name, gender, birth/death dates, place of birth/death, bio, photo, custom fields
- [ ] Photo upload — avatar/photo storage (local file system or Vercel Blob)
- [ ] Timeline view — chronological events for a person (birth, marriage, death, custom events)

## Phase 6: Relationship Types

- [ ] Supported relationship types:
  - Parent → Child (biological)
  - Spouse / Partner
  - Sibling
  - Adopted parent → Adopted child
  - Step-parent → Step-child
  - Half-sibling
- [ ] Relationship constraints — prevent invalid relationships (e.g., circular parentage)
- [ ] Visual distinction — different edge styles/colors per relationship type

## Phase 7: Search & Navigation

- [ ] Global search — search persons across all trees by name
- [ ] In-tree search — find and highlight a specific person in the tree view
- [ ] Breadcrumb navigation — navigate through ancestor/descendant chains
- [ ] Person quick-jump — dropdown list of all persons, click to center view on them

## Phase 8: GEDCOM Import/Export

- [ ] GEDCOM parser — import `.ged` files and convert to persons + relationships
- [ ] GEDCOM exporter — export tree data to standard GEDCOM 5.5.1 format
- [ ] Import preview — show what will be imported before committing
- [ ] Error handling — handle malformed GEDCOM files gracefully

## Phase 9: Export & Sharing

- [ ] Export as PNG/SVG — screenshot the tree canvas as an image
- [ ] Export as PDF — print-ready family tree document
- [ ] Share via link — generate public/protected link for viewing (no edit)
- [ ] Embed code — iframe embed for sharing on external sites

## Phase 10: Polish & Optimization

- [ ] Responsive design — mobile-friendly tree viewer (touch pan/zoom)
- [ ] Dark mode — toggle dark/light theme
- [ ] Performance optimization — virtualized rendering for 500+ person trees, lazy loading
- [ ] Error states — proper error boundaries, toast notifications
- [ ] Loading states — skeletons, spinners
- [ ] Empty states — helpful onboarding for new trees

## Phase 11: Docker & Deployment

- [ ] Dockerfile — multi-stage build for production
- [ ] docker-compose.yml — app + SQLite volume + environment config
- [ ] Environment variables — documented `.env.example`
- [ ] Vercel deployment — `vercel.json` config, edge compatibility
- [ ] README — setup instructions for both Vercel and Docker deployment

## Project Structure

```
belong/
├── src/
│   ├── app/
│   │   ├── (auth)/            # Auth pages (sign-in, sign-up)
│   │   ├── (dashboard)/       # Protected dashboard area
│   │   │   ├── trees/         # Tree list, create, settings
│   │   │   └── tree/[id]/     # Tree editor (React Flow canvas)
│   │   ├── api/
│   │   │   ├── auth/          # Better Auth routes
│   │   │   ├── trees/         # Tree CRUD endpoints
│   │   │   ├── persons/       # Person CRUD endpoints
│   │   │   └── relationships/ # Relationship CRUD endpoints
│   │   ├── share/[id]/        # Public shared tree view
│   │   ├── layout.tsx
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── tree/              # React Flow nodes, edges, controls
│   │   ├── person/            # Person card, profile panel, form
│   │   ├── layout/            # Header, sidebar, navigation
│   │   └── shared/            # Reusable components
│   ├── lib/
│   │   ├── auth.ts            # Better Auth config
│   │   ├── db/                # Drizzle schema, migrations, queries
│   │   ├── gedcom/            # GEDCOM parser & exporter
│   │   └── utils.ts           # Utility functions
│   ├── hooks/                 # Custom React hooks
│   └── types/                 # TypeScript types
├── drizzle/                   # Migration files
├── public/                    # Static assets
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```
