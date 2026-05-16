alter table "relationships" drop constraint if exists "relationships_tree_id_fkey";
alter table "persons" drop constraint if exists "persons_tree_id_fkey";

alter table "relationships" drop column "tree_id";
alter table "relationships" add column "organization_id" text not null references "organization"("id") on delete cascade;

alter table "persons" drop column "tree_id";
alter table "persons" add column "organization_id" text not null references "organization"("id") on delete cascade;

create index if not exists "persons_organization_id_idx" on "persons" ("organization_id");
create index if not exists "relationships_organization_id_idx" on "relationships" ("organization_id");

drop table if exists "tree_members";
drop table if exists "trees";
