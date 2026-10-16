"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import styles from "./auth.module.css";

type Mode = "login" | "signup" | "reset" | "verify";
export default function AuthForm({ emailEnabled, googleEnabled }: { emailEnabled: boolean; googleEnabled: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  function changeMode(value: Mode) { setMode(value); setMessage(""); setFailed(false); }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setBusy(true); setMessage(""); setFailed(false);
    try {
      if (mode === "login") {
        const result = await authClient.signIn.email({ email, password });
        if (result.error) throw new Error("이메일·비밀번호를 확인해 주세요. 이메일 인증이 필요한 경우 확인 메일을 확인하거나 아래에서 다시 요청하세요.");
        router.replace("/account"); router.refresh();
      } else if (mode === "signup") {
        const result = await authClient.signUp.email({ name: String(form.get("name") ?? "").trim(), email, password, callbackURL: "/login?verified=1" });
        if (result.error) throw new Error("가입 요청을 처리하지 못했습니다. 입력 내용을 확인하고 잠시 후 다시 시도해 주세요.");
        setMessage("가입 가능한 주소라면 확인 메일을 보냈습니다. 이메일 확인 후 로그인해 주세요. 위키 이용에는 관리자 승인이 필요합니다.");
      } else if (mode === "reset") {
        const result = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
        if (result.error) throw new Error("메일 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        setMessage("등록된 계정이라면 비밀번호 재설정 메일을 보냈습니다.");
      } else {
        const result = await authClient.sendVerificationEmail({ email, callbackURL: "/login?verified=1" });
        if (result.error) throw new Error("메일 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        setMessage("이메일 확인이 필요한 계정이라면 확인 메일을 보냈습니다.");
      }
    } catch (error) { setFailed(true); setMessage(error instanceof Error ? error.message : "요청을 처리하지 못했습니다."); }
    finally { setBusy(false); }
  }
  async function googleSignIn() {
    setBusy(true); setMessage(""); setFailed(false);
    try {
      const result = await authClient.signIn.social({ provider: "google", callbackURL: "/account", errorCallbackURL: "/login?error=oauth" });
      if (result.error) throw new Error();
    } catch { setFailed(true); setMessage("Google 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요."); setBusy(false); }
  }
  return <div className={styles.box}>
    <div className={styles.tabs} role="group" aria-label="로그인 또는 가입 선택"><button type="button" aria-pressed={mode === "login"} disabled={busy} onClick={() => changeMode("login")}>로그인</button><button type="button" aria-pressed={mode === "signup"} disabled={busy} onClick={() => changeMode("signup")}>회원가입</button></div>
    {mode === "signup" && <p className={styles.help}>이메일 확인과 관리자 승인이 필요합니다. 가입만으로 위키가 공개되지는 않습니다.</p>}
    {mode === "reset" && <h2>비밀번호 재설정 메일 받기</h2>}{mode === "verify" && <h2>이메일 확인 메일 다시 받기</h2>}
    <form onSubmit={submit} className={styles.form}>
      {mode === "signup" && <label>이름<input name="name" autoComplete="name" required maxLength={100} disabled={!emailEnabled || busy} /></label>}
      <label>이메일<input name="email" type="email" autoComplete="email" required maxLength={254} disabled={!emailEnabled || busy} /></label>
      {(mode === "login" || mode === "signup") && <label>비밀번호<input name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={mode === "signup" ? 12 : undefined} maxLength={128} disabled={!emailEnabled || busy} /></label>}
      {mode === "signup" && <p className={styles.help}>비밀번호는 12자 이상 입력하세요. 다른 사이트와 다른 비밀번호를 사용해 주세요.</p>}
      <button className={`${styles.button} ${styles.primary}`} disabled={!emailEnabled || busy}>{busy ? "처리 중…" : mode === "login" ? "이메일로 로그인" : mode === "signup" ? "가입 신청" : "메일 보내기"}</button>
    </form>
    {!emailEnabled && <p className={styles.help}>이메일 로그인과 가입을 준비하고 있습니다.</p>}
    <div className={styles.secondary}><button type="button" disabled={busy} onClick={() => changeMode("reset")}>비밀번호를 잊으셨나요?</button><button type="button" disabled={busy} onClick={() => changeMode("verify")}>이메일 확인 메일 다시 받기</button></div>
    <button type="button" className={`${styles.button} ${styles.google}`} disabled={!googleEnabled || busy} onClick={googleSignIn}>Google로 계속하기</button>
    {!googleEnabled && <p className={styles.help}>Google 로그인을 준비하고 있습니다.</p>}
    {message && <p role={failed ? "alert" : "status"} className={`${styles.message} ${failed ? styles.error : ""}`}>{message}</p>}
  </div>;
}
