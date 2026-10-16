import styles from "./account-nav.module.css";
import { Suspense } from "react";
import Link from "next/link";
import { canManageMembers } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";

async function AccountLink() {
  const user = await getCurrentUser();
  return <>{canManageMembers(user) && <Link href="/admin/members" prefetch={false}>회원 관리</Link>}<Link href={user ? "/account" : "/login"} prefetch={false}>{user ? "내 계정" : "로그인 / 회원가입"}</Link></>;
}

export default function AccountNav() {
  return <Suspense fallback={<span className={styles.status} role="status">계정 확인 중…</span>}><AccountLink /></Suspense>;
}
