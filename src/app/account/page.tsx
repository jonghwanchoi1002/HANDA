import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { canReadWiki, canManageMembers } from "@/lib/auth/permissions";
import AccountShell from "@/components/account-shell";
import SignOut from "@/components/sign-out";
import styles from "@/app/login/auth.module.css";
// 요청 시 DB 또는 세션을 확인하므로 서버 응답을 기다립니다.
export const instant = false;

export const metadata: Metadata = { title: "내 계정 | HANDA", robots: { index: false, follow: false } };
export default async function AccountPage() {
  const user = await getCurrentUser(); if (!user) redirect("/login");
  const approved = canReadWiki(user);
  return <AccountShell><p className={styles.eyebrow}>MY HANDA</p><h1>{user.name}님, 안녕하세요.</h1><p className={styles.intro}>{user.email}</p>
    <section className={styles.box}><h2>{approved ? "이용 승인 완료" : user.approvalStatus === "rejected" ? "가입 신청이 승인되지 않았습니다." : "관리자 승인 대기 중"}</h2><p className={styles.intro}>{approved ? "비즈니스 위키를 열람할 수 있습니다. 콘텐츠 작성과 수정은 관리자만 가능합니다." : "공개된 소개와 모임 후기는 계속 볼 수 있습니다. 비즈니스 위키는 관리자 승인 후 이용할 수 있습니다."}</p>{!user.emailVerified && <p className={styles.message}>이메일 확인이 필요합니다.</p>}
      <div className={styles.links}>{approved && <Link href="/wiki" prefetch={false}>비즈니스 위키 열기 ↗</Link>}{canManageMembers(user) && <Link href="/admin" prefetch={false}>회원 승인 관리 ↗</Link>}<Link href="/">홈페이지로</Link><SignOut /></div></section>
  </AccountShell>;
}
