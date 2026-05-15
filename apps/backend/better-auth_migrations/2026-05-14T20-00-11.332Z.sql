alter table "user" add column if not exists "username" text unique;

alter table "user" add column if not exists "displayUsername" text;