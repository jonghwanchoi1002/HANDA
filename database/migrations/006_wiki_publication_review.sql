ALTER TABLE handa_content DROP CONSTRAINT handa_content_status_check;
ALTER TABLE handa_content ADD CONSTRAINT handa_content_status_check CHECK (status IN ('draft','pending','published'));
ALTER TABLE handa_content ADD CONSTRAINT handa_content_pending_wiki_only CHECK (status <> 'pending' OR kind = 'wiki');
