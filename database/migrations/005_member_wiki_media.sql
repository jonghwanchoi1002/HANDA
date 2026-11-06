ALTER TABLE handa_content ADD COLUMN author_id text REFERENCES handa_auth_user(id) ON DELETE SET NULL;
CREATE INDEX handa_content_author ON handa_content (author_id,kind);
CREATE TABLE handa_media (
  id uuid PRIMARY KEY,
  uploader_id text REFERENCES handa_auth_user(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('wiki','member','story','testimonial')),
  content_key text NOT NULL CHECK (content_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  blob_pathname text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX handa_media_upload_quota ON handa_media (uploader_id,created_at);
