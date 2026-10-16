CREATE TABLE handa_content (
  kind text NOT NULL CHECK (kind IN ('home', 'wiki', 'member', 'story', 'testimonial')),
  content_key text NOT NULL CHECK (content_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  is_example boolean NOT NULL DEFAULT false,
  publication_consent boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kind, content_key),
  CHECK (kind <> 'home' OR content_key = 'homepage'),
  CHECK (kind = 'home' OR payload->>'isExample' IS NOT NULL),
  CHECK (kind = 'home' OR payload->'isExample' = to_jsonb(is_example)),
  CHECK (kind = 'home' OR (COALESCE(payload->>'slug', payload->>'id') IS NOT NULL AND COALESCE(payload->>'slug', payload->>'id') = content_key)),
  CHECK (kind <> 'testimonial' OR status <> 'published' OR is_example OR publication_consent)
);

CREATE INDEX handa_content_public_order ON handa_content (kind, sort_order, content_key) WHERE status = 'published';

CREATE FUNCTION handa_touch_content() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER handa_content_updated BEFORE UPDATE ON handa_content
FOR EACH ROW EXECUTE FUNCTION handa_touch_content();
