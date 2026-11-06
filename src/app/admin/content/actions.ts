"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { getDatabase } from "@/lib/content/database";
import { saveManagedContent, ContentManagementError } from "@/lib/content/management";

export type SaveState = { message: string; saved?: boolean; revision?: number; path?: string };
export async function saveContent(_previous: SaveState, form: FormData): Promise<SaveState> {
  const admin = await requireAdmin();
  if (process.env.CONTENT_SOURCE !== "database") return {message:"현재 콘텐츠를 저장할 수 없습니다. 사이트 설정을 확인해 주세요."};
  const json = form.get("entry");
  if (typeof json !== "string" || json.length > 220000) return {message:"내용이 너무 길거나 올바르지 않습니다."};
  let result;
  try { result = await saveManagedContent(getDatabase(), admin.id, JSON.parse(json)); }
  catch(error) {
    if (error instanceof ContentManagementError) return {message:error.message};
    if (error instanceof z.ZodError) return {message:"필수 항목과 입력 형식을 확인해 주세요. 본문과 각 문단의 내용을 입력해야 합니다."};
    if (error instanceof SyntaxError) return {message:"입력 내용을 확인해 주세요."};
    console.error("Content save failed. Check database migrations and connectivity.");
    return {message:"저장하지 못했습니다. 작성 내용은 유지됩니다. 잠시 후 다시 시도해 주세요."};
  }
  revalidatePath("/", "layout");
  return {message:"저장했습니다.",saved:true,revision:result.revision,path:`/admin/content/${result.kind}/${result.key}`};
}
