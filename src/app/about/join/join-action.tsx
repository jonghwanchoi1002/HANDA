"use client";
import { useEffect, useId, useRef, useState } from "react";
import styles from "../about.module.css";
import dialogStyles from "@/components/leave-dialog.module.css";
export default function JoinAction({kind}:{kind:"apply"|"notify"}){
  const [open,setOpen]=useState(false);const ref=useRef<HTMLDialogElement>(null);const titleId=useId();const descriptionId=useId();
  useEffect(()=>{const dialog=ref.current!;if(open&&!dialog.open)dialog.showModal();if(!open&&dialog.open)dialog.close();},[open]);
  return <><button type="button" className={`${styles.button} ${kind==="notify"?styles.secondary:""}`} onClick={()=>setOpen(true)}>{kind==="apply"?"참여 신청하기":"다음 모집 알림 받기"}</button>
    <dialog ref={ref} className={dialogStyles.dialog} aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={event=>{event.preventDefault();setOpen(false);}}>
      <h2 id={titleId}>{kind==="apply"?"참여 신청을 준비하고 있어요":"다음 모집 알림을 준비하고 있어요"}</h2>
      <p id={descriptionId}>{kind==="apply"?"신청 방법과 모집 일정이 정해지면 이 페이지에서 안내해 드릴게요. 현재는 신청을 접수하지 않습니다.":"모집 알림 신청 기능을 준비하고 있습니다. 신청 방법이 정해지면 이 페이지에서 안내해 드릴게요."}</p>
      <div className={dialogStyles.controls}><button type="button" autoFocus className={styles.button} onClick={()=>setOpen(false)}>확인</button></div>
    </dialog>
  </>;
}
