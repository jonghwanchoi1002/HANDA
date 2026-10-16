import { z } from "zod";
import type { Pool } from "pg";
import { canManageMembers } from "../auth/permissions";
import { parseContent, type ContentKind } from "./schema";

export const kindSchema = z.enum(["home", "wiki", "member", "story", "testimonial"]);
export const labels: Record<ContentKind, string> = { home: "홈 소개", wiki: "비즈니스 위키", member: "멤버 소개", story: "모임 후기", testimonial: "참가자 이야기" };
export const saveSchema = z.object({
  kind: kindSchema, key: z.string().max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  revision: z.number().int().min(0), status: z.enum(["draft", "published"]),
  consent: z.boolean(), order: z.number().int().min(-100000).max(100000), payload: z.unknown(),
});
export type ManagedContent = { kind: ContentKind; key: string; revision: number; status: "draft" | "published"; consent: boolean; order: number; payload: Record<string, unknown> };
export class ContentManagementError extends Error {}

export async function saveManagedContent(database: Pool, actorId: string, raw: unknown) {
  const input = saveSchema.parse(raw);
  const payload = parseContent(input.kind, input.payload);
  const example = "isExample" in payload && payload.isExample;
  if (input.kind === "home" && (input.key !== "homepage" || input.status !== "published")) throw new ContentManagementError("홈 소개는 공개 상태로만 저장할 수 있습니다.");
  if (input.kind !== "home" && ("slug" in payload ? payload.slug : "id" in payload ? payload.id : undefined) !== input.key) throw new ContentManagementError("글 주소가 일치하지 않습니다.");
  if (input.kind === "testimonial" && input.status === "published" && !example && !input.consent) throw new ContentManagementError("실제 참가자 이야기는 공개 동의를 확인해야 합니다.");
  if (JSON.stringify(payload).length > 200000) throw new ContentManagementError("내용이 너무 깁니다. 글을 나누어 저장해 주세요.");
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    // 권한 변경과 동일한 잠금 순서로 처리해 저장 직전의 관리자 권한을 확인합니다.
    await client.query("SELECT pg_advisory_xact_lock(720241017)");
    const actor = await client.query(`SELECT role, approval_status AS "approvalStatus", "emailVerified" FROM handa_auth_user WHERE id=$1 FOR SHARE`, [actorId]);
    if (!canManageMembers(actor.rows[0] ?? null)) throw new ContentManagementError("관리자 권한이 필요합니다.");
    const existing = await client.query("SELECT payload,status,publication_consent,sort_order,revision FROM handa_content WHERE kind=$1 AND content_key=$2 FOR UPDATE", [input.kind,input.key]);
    const previous = existing.rows[0];
    if ((previous?.revision ?? 0) !== input.revision) throw new ContentManagementError("다른 관리자가 수정한 내용이 있습니다. 현재 작성 내용을 복사한 뒤 페이지를 새로고침해 주세요.");
    if (previous) {
      await client.query("UPDATE handa_content SET payload=$3,status=$4,is_example=$5,publication_consent=$6,sort_order=$7,revision=revision+1 WHERE kind=$1 AND content_key=$2", [input.kind,input.key,payload,input.status,example,input.consent,input.order]);
    } else {
      await client.query("INSERT INTO handa_content(kind,content_key,payload,status,is_example,publication_consent,sort_order) VALUES($1,$2,$3,$4,$5,$6,$7)", [input.kind,input.key,payload,input.status,example,input.consent,input.order]);
    }
    await client.query("INSERT INTO handa_content_audit(actor_id,kind,content_key,previous_value,new_value) VALUES($1,$2,$3,$4,$5)", [actorId,input.kind,input.key,previous ?? null,{payload,status:input.status,publication_consent:input.consent,sort_order:input.order,revision:input.revision+1}]);
    await client.query("COMMIT");
  } catch(error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
  return { kind: input.kind, key: input.key, revision: input.revision + 1 };
}
