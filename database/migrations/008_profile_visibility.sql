ALTER TABLE handa_auth_user ADD COLUMN profile_visibility text NOT NULL DEFAULT 'private'
  CHECK (profile_visibility IN ('private','members','public'));
