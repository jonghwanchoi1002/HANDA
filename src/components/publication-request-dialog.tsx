"use client";
import { useEffect, useRef } from "react";
import common from "@/app/login/auth.module.css";
import styles from "./leave-dialog.module.css";
export default function PublicationRequestDialog({open,onConfirm}:{open:boolean;onConfirm:()=>void}){
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const dialog=ref.current!;if(open&&!dialog.open)dialog.showModal();if(!open&&dialog.open)dialog.close();},[open]);
  return <dialog ref={ref} className={styles.dialog} aria-labelledby="publication-request-title" aria-describedby="publication-request-description" onCancel={event=>event.preventDefault()}>
    <h2 id="publication-request-title">작성 완료 · 공개 대기 중</h2>
    <p id="publication-request-description">글이 저장되었습니다. 관리자가 내용을 확인하고 승인하면 비즈니스 위키에 공개됩니다.</p>
    <div className={styles.controls}><button type="button" autoFocus className={`${common.button} ${common.primary}`} onClick={onConfirm}>확인</button></div>
  </dialog>;
}
