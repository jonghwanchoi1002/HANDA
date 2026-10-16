"use client";
import { useActionState } from "react";
import { updateMembership } from "./actions";
import styles from "@/app/login/auth.module.css";
export default function MemberActions({ id, verified, approved }: { id: string; verified: boolean; approved: boolean }) {
  const [state, action, pending] = useActionState(updateMembership, { message: "" });
  return <form action={action}><input type="hidden" name="id" value={id} /><div className={styles.actions}><button className={`${styles.button} ${styles.primary}`} name="decision" value="approved" disabled={pending || !verified || approved}>이용 승인</button><button className={styles.button} name="decision" value="rejected" disabled={pending}>{approved ? "이용 중지" : "가입 거절"}</button></div>{state.message && <p role="status">{state.message}</p>}</form>;
}
