"use client";
import { useEffect, useRef } from "react";
import common from "@/app/login/auth.module.css";
import styles from "./leave-dialog.module.css";
export default function LeaveDialog({open,onCancel,onContinue}:{open:boolean;onCancel:()=>void;onContinue:()=>void}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const dialog=ref.current!;if(open&&!dialog.open)dialog.showModal();if(!open&&dialog.open)dialog.close();},[open]);
  return <dialog ref={ref} className={styles.dialog} aria-labelledby="leave-title" aria-describedby="leave-description" onCancel={event=>{event.preventDefault();onCancel();}}>
    <h2 id="leave-title">저장하지 않고 이동할까요?</h2><p id="leave-description">저장하지 않은 내용은 사라집니다. 계속 이동하시겠어요?</p>
    <div className={styles.controls}><button type="button" className={common.button} autoFocus onClick={onCancel}>취소</button><button type="button" className={`${common.button} ${common.primary}`} onClick={onContinue}>계속</button></div>
  </dialog>;
}
