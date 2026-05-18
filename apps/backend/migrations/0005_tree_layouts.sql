drop table if exists "tree_layouts";

create table "tree_layouts" (
  "organization_id" text not null references "organization"("id") on delete cascade,
  "layout_mode" text not null check ("layout_mode" in ('TB', 'LR', 'FREE')),
  "node_positions" jsonb not null default '{}',
  "updated_at" timestamptz not null default current_timestamp,
  primary key ("organization_id", "layout_mode")
);
