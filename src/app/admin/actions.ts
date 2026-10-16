"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { getDatabase } from "@/lib/content/database";
import { changeMembershipStatus } from "@/lib/auth/membership";
export async function updateMembership(_previous: { message: string }, form: FormData) {
  const admin = await requireAdmin();
  const input = z.object({ id: z.string().min(1).max(128), decision: z.enum(["approved","rejected"]) }).safeParse({ id: form.get("id"), decision: form.get("decision") });
  if (!input.success) return { message: "유효하지 않은 요청입니다." };
  try { await changeMembershipStatus(getDatabase(), admin.id, input.data.id, input.data.decision); }
  catch { return { message: "처리하지 못했습니다. 이메일 확인 여부와 현재 권한을 확인한 뒤 다시 시도해 주세요." }; }
  revalidatePath("/admin"); revalidatePath("/account"); revalidatePath("/wiki", "layout");
  return { message: input.data.decision === "approved" ? "회원 이용을 승인했습니다." : "회원 이용을 거절 또는 중지했습니다." };
}
