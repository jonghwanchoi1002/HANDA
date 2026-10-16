import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageMembers } from "@/lib/auth/permissions";

async function AdminLink() {
  const user = await getCurrentUser();
  return canManageMembers(user) ? <Link href="/admin/members" prefetch={false}>회원 관리</Link> : null;
}

export default function AdminNav() {
  return <Suspense fallback={null}><AdminLink /></Suspense>;
}
