-- Only replace the original sample copy; administrator-written copy is preserved.
-- Serialize with content saves, advance revision, and keep an audit record.
SELECT pg_advisory_xact_lock(720241017);
WITH previous AS (
  SELECT * FROM handa_content WHERE kind='home' AND content_key='homepage' FOR UPDATE
), revised AS (
  SELECT p.*, '{"aboutValue1Title": "사람과 연결되고", "aboutValue1Description": "각자의 도전과 배움을 나눌 동료를 만납니다.", "aboutValue2Title": "경험을 나누고", "aboutValue2Description": "창업과 운영의 노하우를 서로에게 아낌없이.", "aboutValue3Title": "함께 성장합니다", "aboutValue3Description": "다음 한 걸음을 함께 고민합니다."}'::jsonb || p.payload
      || CASE WHEN p.payload->'heroTitle'='"시작하고,"'::jsonb THEN '{"heroTitle": "혼자 고민하던 일을,"}'::jsonb ELSE '{}'::jsonb END
      || CASE WHEN p.payload->'heroSubtitle'='"함께"'::jsonb THEN '{"heroSubtitle": "함께 풀어가는"}'::jsonb ELSE '{}'::jsonb END
      || CASE WHEN p.payload->'heroHighlight'='"성장합니다."'::jsonb THEN '{"heroHighlight": "곳."}'::jsonb ELSE '{}'::jsonb END
      || CASE WHEN p.payload->'heroDescription'='["창업의 고민과 경험을 나누는", "베를린 창업자 커뮤니티, HANDA."]'::jsonb THEN '{"heroDescription": ["낯선 환경에서 시작하는 창업. 경험을 나눌 동료가 있다면 달라집니다."]}'::jsonb ELSE '{}'::jsonb END
      || CASE WHEN p.payload->'aboutTitle'='["혼자 고민하던 일을,", "함께 풀어가는 곳."]'::jsonb THEN '{"aboutTitle": ["베를린에서 창업을 꿈꾸는 사람들이 연결되는 커뮤니티."]}'::jsonb ELSE '{}'::jsonb END
      || CASE WHEN p.payload->'aboutLead'='["낯선 환경에서 시작하는 창업.", "경험을 나눌 동료가 있다면 달라집니다."]'::jsonb THEN '{"aboutLead": []}'::jsonb ELSE '{}'::jsonb END
      || CASE WHEN p.payload->'aboutDescription'='"HANDA는 베를린에서 창업에 관심 있는 사람들이 연결되는 커뮤니티입니다. 각자의 도전과 배움을 나누며, 다음 한 걸음을 함께 고민합니다."'::jsonb THEN '{"aboutDescription": ""}'::jsonb ELSE '{}'::jsonb END AS next_payload FROM previous p
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
