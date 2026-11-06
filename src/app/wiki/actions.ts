"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canManageMembers } from "@/lib/auth/permissions";
import { requireWikiMember } from "@/lib/auth/session";
import { getDatabase } from "@/lib/content/database";
import { saveManagedContent, ContentManagementError } from "@/lib/content/management";
import type { SaveState } from "@/app/admin/content/actions";
export async function saveWiki(_previous:SaveState,form:FormData):Promise<SaveState> {
  const user=await requireWikiMember();
  if(process.env.CONTENT_SOURCE!=="database")return {message:"현재 글을 저장할 수 없습니다. 잠시 후 다시 시도해 주세요."};
  const json=form.get("entry");if(typeof json!=="string"||json.length>220000)return {message:"내용이 너무 길거나 올바르지 않습니다."};
  try {
    const input=JSON.parse(json);if(input.kind!=="wiki")return {message:"위키 글만 작성할 수 있습니다."};
    const result=await saveManagedContent(getDatabase(),user.id,input,{wikiMember:true});
    revalidatePath("/wiki","layout");
    return {message:input.status==="pending"?"작성을 완료했습니다. 관리자 공개 승인을 기다리고 있습니다.":"저장했습니다.",saved:true,revision:result.revision,path:"/wiki",reviewRequested:input.status==="pending"&&!canManageMembers(user)};
  }catch(error){if(error instanceof ContentManagementError)return {message:error.message};if(error instanceof z.ZodError||error instanceof SyntaxError)return {message:"제목, 분류, 요약과 본문 내용을 확인해 주세요."};console.error("Wiki save failed.");return {message:"저장하지 못했습니다. 작성 내용은 유지됩니다. 잠시 후 다시 시도해 주세요."};}
}
