import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "./server";
import { canReadWiki, canManageMembers } from "./permissions";
import { getDatabase } from "@/lib/content/database";

// React cache는 한 요청에서만 중복 조회를 줄입니다. 사용자 간 세션 캐시는 사용하지 않습니다.
export const getCurrentUser = cache(async () => {
  const requestHeaders = await headers();
  const auth = getAuth();
  if (!auth) return null;
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return null;
  const result = await getDatabase().query<{ id: string; name: string; email: string; role: string; approvalStatus: string; emailVerified: boolean }>(
    `SELECT id, name, email, role, approval_status AS "approvalStatus", "emailVerified" FROM handa_auth_user WHERE id = $1`, [session.user.id]);
  return result.rows[0] ?? null;
});
export async function requireWikiMember() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canReadWiki(user)) redirect("/account");
  return user;
}
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageMembers(user)) redirect("/account");
  return user;
}
