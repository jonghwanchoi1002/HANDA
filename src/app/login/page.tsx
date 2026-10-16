import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { authAvailability } from "@/lib/auth/server";
import AccountShell from "@/components/account-shell";
import AuthForm from "./auth-form";
import styles from "./auth.module.css";
export const metadata: Metadata = { title: "로그인 · 가입 | HANDA", robots: { index: false, follow: false } };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ verified?: string; error?: string }> }) {
  if (await getCurrentUser()) redirect("/account");
  const parameters = await searchParams;
  const availability = authAvailability();
  return <AccountShell><p className={styles.eyebrow}>HANDA COMMUNITY</p><h1>함께하는 첫걸음.</h1><p className={styles.intro}>소개와 모임 후기는 누구나 볼 수 있습니다.<br />비즈니스 위키는 승인된 회원에게 열려 있습니다.</p>
    {parameters.verified === "1" && <p className={styles.message}>이메일 확인이 완료되었습니다. 로그인해 가입 상태를 확인하세요.</p>}
    {parameters.error && <p role="alert" className={`${styles.message} ${styles.error}`}>로그인 또는 이메일 확인 링크가 유효하지 않습니다. 다시 시도해 주세요.</p>}
    <AuthForm emailEnabled={availability.email} googleEnabled={availability.google} /></AccountShell>;
}
