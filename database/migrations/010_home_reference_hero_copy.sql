-- Explicitly replace hero copy, including previous WIP/testing text, per design request.
-- About text and its editable values are preserved.
-- Serialize with content saves, advance revision, and keep an audit record.
SELECT pg_advisory_xact_lock(720241017);
WITH previous AS (
  SELECT * FROM handa_content WHERE kind='home' AND content_key='homepage' FOR UPDATE
), revised AS (
  SELECT p.*, p.payload || '{"heroTitle": "혼자 고민하던 일을,", "heroSubtitle": "함께 풀어가는", "heroHighlight": "곳.", "heroDescription": ["낯선 환경에서 시작하는 창업. 경험을 나눌 동료가 있다면 달라집니다."]}'::jsonb AS next_payload FROM previous p
), changed AS (
  UPDATE handa_content h SET payload=r.next_payload,revision=h.revision+1,updated_at=now()
  FROM revised r WHERE h.kind=r.kind AND h.content_key=r.content_key
    AND h.payload IS DISTINCT FROM r.next_payload
  RETURNING h.content_key,h.payload,h.status,h.publication_consent,h.sort_order,h.revision,
    r.payload AS old_payload,r.status AS old_status,r.revision AS old_revision
)
INSERT INTO handa_content_audit(actor_id,kind,content_key,previous_value,new_value)
SELECT NULL,'home',content_key,
  jsonb_build_object('payload',old_payload,'status',old_status,'publication_consent',publication_consent,'sort_order',sort_order,'revision',old_revision),
  jsonb_build_object('payload',payload,'status',status,'publication_consent',publication_consent,'sort_order',sort_order,'revision',revision)
FROM changed;
