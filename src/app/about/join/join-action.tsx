"use client";
import { useEffect, useId, useRef, useState } from "react";
import styles from "../about.module.css";
import dialogStyles from "@/components/leave-dialog.module.css";
export default function JoinAction({label,formUrl}:{label:string;formUrl:string}){
  const [open,setOpen]=useState(false);const ref=useRef<HTMLDialogElement>(null);const titleId=useId();const descriptionId=useId();
  useEffect(()=>{const dialog=ref.current!;if(open&&!dialog.open)dialog.showModal();if(!open&&dialog.open)dialog.close();},[open]);
  return <><button type="button" className={styles.button} onClick={()=>setOpen(true)}>{label}</button>
    <dialog ref={ref} className={dialogStyles.dialog} aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={event=>{event.preventDefault();setOpen(false);}}>
      <h2 id={titleId}>다음 HANDA 모집 소식을 받아보세요!</h2>
      <div id={descriptionId}><p>현재는 정기 모집 기간이 아닙니다.</p><p>HANDA에 관심이 있으시다면 연락처를 남겨주세요. 다음 모집 일정과 참여 기회가 확정되면 가장 먼저 안내해 드릴게요.</p></div>
      <div className={`${dialogStyles.controls} ${styles.joinDialogActions}`}>
        <a className={`${styles.button} ${styles.secondary}`} href={formUrl} target="_blank" rel="noopener noreferrer">다음 모집 안내받기</a>
        <button type="button" autoFocus className={styles.button} onClick={()=>setOpen(false)}>확인</button>
      </div>
    </dialog>
  </>;
}
