import "server-only";
import { connection } from "next/server";
import { getDatabase } from "./database";
import { readPublishedContent } from "./repository";
import type { ContentKind, ContentMap } from "./schema";

// 연결 실패를 예시 데이터로 감추지 않고 오류로 처리합니다.
export async function getDatabaseContent<K extends ContentKind>(kind: K, key?: string): Promise<ContentMap[K][] | null> {
  await connection(); // 데이터 소스와 공개 콘텐츠는 요청 시 확인합니다.
  const source = process.env.CONTENT_SOURCE ?? "sample";
  if (source === "sample") return null;
  if (source !== "database") throw new Error("CONTENT_SOURCE must be sample or database.");
  return readPublishedContent((sql, values) => getDatabase().query(sql, values), kind, key);
}
