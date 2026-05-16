alter table "session" add column if not exists "activeOrganizationId" text;

create table if not exists "organization" ("id" text not null primary key, "name" text not null, "slug" text not null unique, "logo" text, "createdAt" timestamptz not null, "metadata" text, "description" text, "coverImage" text, "isPublic" boolean);

create table if not exists "member" ("id" text not null primary key, "organizationId" text not null references "organization" ("id") on delete cascade, "userId" text not null references "user" ("id") on delete cascade, "role" text not null, "createdAt" timestamptz not null);

create table if not exists "invitation" ("id" text not null primary key, "organizationId" text not null references "organization" ("id") on delete cascade, "email" text not null, "role" text, "status" text not null, "expiresAt" timestamptz not null, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "inviterId" text not null references "user" ("id") on delete cascade);

create unique index "organization_slug_uidx" on "organization" ("slug");

create index if not exists "member_organizationId_idx" on "member" ("organizationId");

create index if not exists "member_userId_idx" on "member" ("userId");

create index if not exists "invitation_organizationId_idx" on "invitation" ("organizationId");

create index if not exists "invitation_email_idx" on "invitation" ("email");