ALTER TABLE handa_media DROP CONSTRAINT handa_media_kind_check;
ALTER TABLE handa_media ADD CONSTRAINT handa_media_kind_check CHECK (kind IN ('home','wiki','member','story','testimonial'));
