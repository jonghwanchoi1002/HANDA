create table "handa_auth_user" ("id" text not null primary key, "name" text not null, "email" text not null unique, "emailVerified" boolean not null, "image" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null, "role" text not null, "approval_status" text not null);

create table "handa_auth_session" ("id" text not null primary key, "expiresAt" timestamptz not null, "token" text not null unique, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null, "ipAddress" text, "userAgent" text, "userId" text not null references "handa_auth_user" ("id") on delete cascade);

create table "handa_auth_account" ("id" text not null primary key, "accountId" text not null, "providerId" text not null, "userId" text not null references "handa_auth_user" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" timestamptz, "refreshTokenExpiresAt" timestamptz, "scope" text, "password" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null);

create table "handa_auth_verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" timestamptz not null, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null);

create table "handa_auth_rate_limit" ("id" text not null primary key, "key" text not null unique, "count" integer not null, "lastRequest" bigint not null);

create index "handa_auth_session_userId_idx" on "handa_auth_session" ("userId");

create index "handa_auth_account_userId_idx" on "handa_auth_account" ("userId");

create index "handa_auth_verification_identifier_idx" on "handa_auth_verification" ("identifier");
ALTER TABLE handa_auth_user ALTER COLUMN role SET DEFAULT 'member';
ALTER TABLE handa_auth_user ALTER COLUMN approval_status SET DEFAULT 'pending';
ALTER TABLE handa_auth_user ADD CONSTRAINT handa_auth_role CHECK (role IN ('member','admin'));
ALTER TABLE handa_auth_user ADD CONSTRAINT handa_auth_approval CHECK (approval_status IN ('pending','approved','rejected'));
CREATE INDEX handa_auth_pending_users ON handa_auth_user (approval_status, "createdAt");

CREATE TABLE handa_membership_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id text NOT NULL REFERENCES handa_auth_user(id),
  target_id text NOT NULL REFERENCES handa_auth_user(id),
  action text NOT NULL CHECK (action IN ('approved','rejected','grant_admin')),
  previous_status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
