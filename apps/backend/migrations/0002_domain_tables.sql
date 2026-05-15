create table if not exists "trees" (
  "id" uuid primary key default gen_random_uuid(),
  "owner_id" text not null references "user"("id") on delete cascade,
  "name" text not null,
  "description" text not null default '',
  "cover_image" text not null default '',
  "is_public" boolean not null default false,
  "created_at" timestamptz not null default current_timestamp,
  "updated_at" timestamptz not null default current_timestamp
);

create index if not exists "trees_owner_id_idx" on "trees" ("owner_id");

create table if not exists "tree_members" (
  "id" uuid primary key default gen_random_uuid(),
  "tree_id" uuid not null references "trees"("id") on delete cascade,
  "user_id" text not null references "user"("id") on delete cascade,
  "role" text not null check ("role" in ('owner', 'editor', 'viewer')),
  unique("tree_id", "user_id")
);

create index if not exists "tree_members_tree_id_idx" on "tree_members" ("tree_id");
create index if not exists "tree_members_user_id_idx" on "tree_members" ("user_id");

create table if not exists "persons" (
  "id" uuid primary key default gen_random_uuid(),
  "tree_id" uuid not null references "trees"("id") on delete cascade,
  "first_name" text not null default '',
  "last_name" text not null default '',
  "gender" text not null default '',
  "birth_date" text not null default '',
  "death_date" text not null default '',
  "bio" text not null default '',
  "avatar_url" text not null default '',
  "is_deceased" boolean not null default false,
  "metadata" jsonb not null default '{}',
  "created_at" timestamptz not null default current_timestamp,
  "updated_at" timestamptz not null default current_timestamp
);

create index if not exists "persons_tree_id_idx" on "persons" ("tree_id");

create table if not exists "relationships" (
  "id" uuid primary key default gen_random_uuid(),
  "tree_id" uuid not null references "trees"("id") on delete cascade,
  "person_a_id" uuid not null references "persons"("id") on delete cascade,
  "person_b_id" uuid not null references "persons"("id") on delete cascade,
  "type" text not null check ("type" in ('parent', 'child', 'spouse', 'sibling', 'adopted', 'step-parent', 'step-child')),
  "metadata" jsonb not null default '{}',
  "created_at" timestamptz not null default current_timestamp,
  constraint "different_persons" check ("person_a_id" != "person_b_id")
);

create index if not exists "relationships_tree_id_idx" on "relationships" ("tree_id");
create index if not exists "relationships_person_a_id_idx" on "relationships" ("person_a_id");
create index if not exists "relationships_person_b_id_idx" on "relationships" ("person_b_id");
