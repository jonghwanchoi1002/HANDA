import type { ContentKind, ContentMap } from "./schema";
import { parseContent } from "./schema";

export type ContentQuery = (sql: string, values: unknown[]) => Promise<{ rows: { payload: unknown }[] }>;

// DB와 화면 사이의 경계입니다. SQL 값은 문자열로 조합하지 않고 매개변수로 전달합니다.
export async function readPublishedContent<K extends ContentKind>(query: ContentQuery, kind: K, key?: string): Promise<ContentMap[K][]> {
  const result = await query(`
    SELECT payload FROM handa_content
    WHERE kind = $1 AND status = 'published'
      AND ($2::text IS NULL OR content_key = $2)
      AND (kind <> 'testimonial' OR is_example OR publication_consent)
    ORDER BY sort_order ASC, content_key ASC
  `, [kind, key ?? null]);
  try {
    return result.rows.map((row) => parseContent(kind, row.payload));
  } catch {
    throw new Error(`Invalid ${kind} content in database. Check the saved content format.`);
  }
}
