ALTER TABLE handa_content ADD COLUMN revision integer NOT NULL DEFAULT 1 CHECK (revision > 0);
CREATE TABLE handa_content_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id text REFERENCES handa_auth_user(id) ON DELETE SET NULL,
  kind text NOT NULL,
  content_key text NOT NULL,
  previous_value jsonb,
  new_value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
