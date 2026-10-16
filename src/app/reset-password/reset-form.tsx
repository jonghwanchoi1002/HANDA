"use client";
import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import styles from "@/app/login/auth.module.css";
export default function ResetForm({ token }: { token: string | null }) {
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");const [done,setDone]=useState(false);
  return <div className={styles.box}>{!token ? <p>유효한 재설정 링크가 필요합니다. 로그인 화면에서 새 링크를 요청하세요.</p> : !done && <form className={styles.form} onSubmit={async event=>{event.preventDefault();const form=new FormData(event.currentTarget);const password=String(form.get("password")??"");if(password!==form.get("confirm")){setMessage("비밀번호가 일치하지 않습니다.");return;}setBusy(true);setMessage("");try{const result=await authClient.resetPassword({newPassword:password,token});if(result.error)throw new Error();setDone(true);setMessage("비밀번호를 변경했습니다. 새 비밀번호로 로그인하세요.");}catch{setMessage("비밀번호를 변경하지 못했습니다. 링크가 만료됐다면 새로 요청하세요.");}finally{setBusy(false);}}}>
    <label>새 비밀번호<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required disabled={busy}/></label><label>새 비밀번호 확인<input name="confirm" type="password" autoComplete="new-password" minLength={12} maxLength={128} required disabled={busy}/></label><button className={`${styles.button} ${styles.primary}`} disabled={busy}>{busy?"변경 중…":"비밀번호 변경"}</button></form>}
    {message && <p role="status" className={styles.message}>{message}</p>}<div className={styles.links}><Link href="/login">로그인으로 돌아가기</Link></div></div>;
}
