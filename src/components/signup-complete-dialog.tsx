"use client";

import { useEffect, useId, useRef } from "react";
import common from "@/app/login/auth.module.css";
import styles from "./leave-dialog.module.css";

export default function SignupCompleteDialog({ open, onHome, onLogin }: { open: boolean; onHome: () => void; onLogin: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const homeRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current!;
    if (open && !dialog.open) {
      dialog.showModal();
      homeRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return <dialog ref={ref} className={`${styles.dialog} ${common.signupDialog}`} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={event => { event.preventDefault(); onLogin(); }}>
    <p className={common.eyebrow}>WELCOME TO HANDA</p>
    <h2 id={`${id}-title`}>가입 요청을 접수했습니다.</h2>
    <div id={`${id}-description`}>
      <p>이메일 확인이 필요한 계정이라면 가입한 주소로 인증 메일이 발송됩니다. 메일의 확인 링크를 누른 뒤 로그인해 주세요.</p>
      <p>메일이 보이지 않으면 스팸함을 확인하거나 로그인 화면에서 확인 메일을 다시 요청해 주세요.</p>
      <p>비즈니스 위키는 이메일 확인과 관리자 승인 후 이용할 수 있습니다.</p>
    </div>
    <div className={`${styles.controls} ${common.signupDialogControls}`}>
      <button type="button" className={common.button} onClick={onLogin}>로그인 화면으로</button>
      <button ref={homeRef} type="button" className={`${common.button} ${common.primary}`} onClick={onHome}>홈으로 가기</button>
    </div>
  </dialog>;
}
