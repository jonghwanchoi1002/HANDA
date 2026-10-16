import "server-only";
import { connection } from "next/server";
import { getDatabase } from "./database";
import { readPublishedContent } from "./repository";
import type { ContentKind, ContentMap } from "./schema";

// 연결 실패를 예시 데이터로 감추지 않고 오류로 처리합니다.
export async function getDatabaseContent<K extends ContentKind>(kind: K, key?: string): Promise<ContentMap[K][] | null> {
  const source = process.env.CONTENT_SOURCE ?? "sample";
  if (source === "sample") return null;
  if (source !== "database") throw new Error("CONTENT_SOURCE must be sample or database.");
  await connection(); // 빌드 중 DB 접속 없이, 변경 내용을 다음 요청에서 읽습니다.
  return readPublishedContent((sql, values) => getDatabase().query(sql, values), kind, key);
}
