"use client";
import { useActionState } from "react";
import { updateMemberRole } from "./actions";
import styles from "@/app/login/auth.module.css";
export default function RoleActions({ id, name, role, eligible, self }: { id: string; name: string; role: string; eligible: boolean; self: boolean }) {
  const [state,action,pending] = useActionState(updateMemberRole,{message:""});
  const promote = role !== "admin";
  return <form action={action} onSubmit={event => {
    const message = promote ? `${name}님을 관리자로 지정할까요? 회원 승인과 관리자 권한 변경을 할 수 있게 됩니다.` : `${name}님의 관리자 권한을 해제할까요? 일반 회원 권한은 유지됩니다.`;
    if (!window.confirm(message)) event.preventDefault();
  }}>
    <input type="hidden" name="id" value={id}/><input type="hidden" name="role" value={promote?"admin":"member"}/>
    <div className={styles.actions}><button className={styles.button} disabled={pending || !eligible || self}>{promote?"관리자로 승격":"관리자 권한 해제"}</button></div>
    {self && <p className={styles.help}>본인 계정입니다. 권한 해제는 다른 관리자에게 요청하세요.</p>}
    {!eligible && promote && <p className={styles.help}>이메일 확인과 이용 승인 후 관리자로 지정할 수 있습니다.</p>}
    {state.message && <p role="status">{state.message}</p>}
  </form>;
}
