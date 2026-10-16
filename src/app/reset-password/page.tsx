import type { Metadata } from "next";
import AccountShell from "@/components/account-shell";
import ResetForm from "./reset-form";
import styles from "@/app/login/auth.module.css";
// 요청 시 DB 또는 세션을 확인하므로 서버 응답을 기다립니다.
export const instant = false;

export const metadata: Metadata = { title: "비밀번호 재설정 | HANDA", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const params = await searchParams;
  return <AccountShell><p className={styles.eyebrow}>ACCOUNT RECOVERY</p><h1>새 비밀번호 설정</h1><ResetForm token={!params.error && params.token && params.token.length < 2048 ? params.token : null} /></AccountShell>;
}
