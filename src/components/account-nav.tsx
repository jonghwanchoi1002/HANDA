import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";

async function AccountLink() {
  const user = await getCurrentUser();
  return <Link href={user ? "/account" : "/login"} prefetch={false}>{user ? "내 계정" : "로그인 / 회원가입"}</Link>;
}

export default function AccountNav() {
  return <Suspense fallback={<span role="status">계정 확인 중…</span>}><AccountLink /></Suspense>;
}
