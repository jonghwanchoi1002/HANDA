-- Preserve previously written bodies and their formatting as a single section.
-- Only untouched example records without a body receive example-only starter copy.
UPDATE handa_content
SET payload = jsonb_set(payload, '{sections}', jsonb_build_array(
  jsonb_strip_nulls(jsonb_build_object(
    'number', '', 'title', '', 'highlight', false,
    'paragraphs', to_jsonb(ARRAY(SELECT btrim(line) FROM regexp_split_to_table(payload->>'body', E'\\r?\\n') AS line WHERE length(btrim(line)) > 0)),
    'bodyRichText', payload->'richText'->'body'
  ))
)), revision = revision + 1
WHERE kind = 'testimonial' AND NOT (payload ? 'sections')
  AND length(btrim(coalesce(payload->>'body', ''))) > 0;

UPDATE handa_content
SET payload = jsonb_set(payload, '{sections}', jsonb_build_array(jsonb_build_object(
  'number', '', 'title', '함께한 경험', 'highlight', false,
  'paragraphs', jsonb_build_array('서로의 경험을 나누며 다음에 실행할 작은 목표를 정할 수 있었습니다. 화면 확인을 위한 예시 후기입니다.')
))), revision = revision + 1
WHERE kind = 'testimonial' AND is_example = true AND NOT (payload ? 'sections');
