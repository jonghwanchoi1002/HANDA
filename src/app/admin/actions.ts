"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { getDatabase } from "@/lib/content/database";
import { changeMembershipStatus, changeMemberRole, MemberManagementError } from "@/lib/auth/membership";

function refreshMembers() {
  revalidatePath("/admin"); revalidatePath("/admin/members"); revalidatePath("/account"); revalidatePath("/wiki", "layout");
}
function errorMessage(error: unknown) {
  return { message: error instanceof MemberManagementError ? error.message : "처리하지 못했습니다. 잠시 후 다시 시도해 주세요." };
}
export async function updateMembership(_previous: { message: string }, form: FormData) {
  const admin = await requireAdmin();
  const input = z.object({ id: z.string().min(1).max(128), decision: z.enum(["approved","rejected"]) }).safeParse({ id: form.get("id"), decision: form.get("decision") });
  if (!input.success) return { message: "유효하지 않은 요청입니다." };
  try { await changeMembershipStatus(getDatabase(), admin.id, input.data.id, input.data.decision); }
  catch (error) { return errorMessage(error); }
  refreshMembers();
  return { message: input.data.decision === "approved" ? "회원 이용을 승인했습니다." : "회원 이용을 거절 또는 중지했습니다." };
}
export async function updateMemberRole(_previous: { message: string }, form: FormData) {
  const admin = await requireAdmin();
  const input = z.object({ id: z.string().min(1).max(128), role: z.enum(["member","admin"]) }).safeParse({ id: form.get("id"), role: form.get("role") });
  if (!input.success) return { message: "유효하지 않은 요청입니다." };
  try { await changeMemberRole(getDatabase(),admin.id,input.data.id,input.data.role); }
  catch (error) { return errorMessage(error); }
  refreshMembers();
  return { message: input.data.role === "admin" ? "관리자로 승격했습니다." : "관리자 권한을 해제했습니다. 일반 회원으로 이용할 수 있습니다." };
}
