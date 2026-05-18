create table if not exists "person_events" (
  "id" uuid primary key default gen_random_uuid(),
  "organization_id" text not null references "organization"("id") on delete cascade,
  "person_id" uuid not null references "persons"("id") on delete cascade,
  "type" text not null default 'custom',
  "title" text not null,
  "date" text not null default '',
  "description" text not null default '',
  "metadata" jsonb not null default '{}',
  "created_at" timestamptz not null default current_timestamp,
  "updated_at" timestamptz not null default current_timestamp
);

create index if not exists "person_events_person_id_idx" on "person_events" ("person_id");
create index if not exists "person_events_organization_id_idx" on "person_events" ("organization_id");
