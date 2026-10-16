"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import styles from "@/app/login/auth.module.css";
export default function SignOut() {
  const [busy, setBusy] = useState(false); const [error,setError] = useState(false);
  return <><button type="button" className={styles.button} disabled={busy} onClick={async () => { setBusy(true);setError(false); try { const result=await authClient.signOut(); if(result.error) throw new Error(); window.location.replace("/"); } catch {setError(true);setBusy(false);} }}>{busy ? "로그아웃 중…" : "로그아웃"}</button>{error && <p role="alert">로그아웃하지 못했습니다. 다시 시도해 주세요.</p>}</>;
}
