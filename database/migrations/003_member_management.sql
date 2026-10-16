ALTER TABLE handa_membership_audit DROP CONSTRAINT handa_membership_audit_action_check;
ALTER TABLE handa_membership_audit ADD CONSTRAINT handa_membership_audit_action_check
  CHECK (action IN ('approved', 'rejected', 'grant_admin', 'revoke_admin'));
ALTER TABLE handa_membership_audit
  ADD COLUMN previous_role text CHECK (previous_role IN ('member','admin')),
  ADD COLUMN new_role text CHECK (new_role IN ('member','admin')),
  ADD COLUMN new_status text CHECK (new_status IN ('pending','approved','rejected'));
