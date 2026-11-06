ALTER TABLE handa_auth_user
  ADD COLUMN approval_notice_version integer NOT NULL DEFAULT 0 CHECK (approval_notice_version >= 0),
  ADD COLUMN approval_notice_seen_version integer NOT NULL DEFAULT 0 CHECK (approval_notice_seen_version >= 0),
  ADD CONSTRAINT handa_approval_notice_versions CHECK (approval_notice_seen_version <= approval_notice_version);

-- 이미 승인된 계정도 기능 적용 후 처음 한 번 안내합니다.
UPDATE handa_auth_user SET approval_notice_version=1 WHERE approval_status='approved' AND "emailVerified"=true;

CREATE FUNCTION handa_track_approval_notice() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    IF NEW.approval_status='approved' AND NEW."emailVerified" THEN
      NEW.approval_notice_version=1;
      NEW.approval_notice_seen_version=0;
    END IF;
  ELSIF NEW.approval_status='approved' AND NEW."emailVerified"
    AND (OLD.approval_status<>'approved' OR NOT OLD."emailVerified") THEN
    NEW.approval_notice_version=OLD.approval_notice_version+1;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER handa_approval_notice BEFORE INSERT OR UPDATE ON handa_auth_user
FOR EACH ROW EXECUTE FUNCTION handa_track_approval_notice();
