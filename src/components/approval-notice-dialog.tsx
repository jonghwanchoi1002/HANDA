"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { confirmApproval } from "@/app/account/actions";
import common from "@/app/login/auth.module.css";
import styles from "./leave-dialog.module.css";
export default function ApprovalNoticeDialog({initialVersion,watchPending}:{initialVersion:number|null;watchPending:boolean}){
  const ref=useRef<HTMLDialogElement>(null);const [version,setVersion]=useState(initialVersion);const [error,setError]=useState("");const [pending,startTransition]=useTransition();const path=usePathname();const acknowledged=useRef(0);
  useEffect(()=>{
    let request:AbortController|undefined;
    const sync=async()=>{
      if(document.visibilityState!=="visible")return;
      request?.abort();const current=new AbortController();request=current;
      try{const response=await fetch("/api/account/approval",{cache:"no-store",signal:current.signal});if(current.signal.aborted)return;if(response.status===401){setVersion(null);return;}if(response.ok){const data=await response.json();if(!current.signal.aborted)setVersion(data.version&&data.version>acknowledged.current?data.version:null);}}catch{/* 다음 이동·포커스에서 다시 확인합니다. */}
    };
    void sync();window.addEventListener("focus",sync);
    const timer=watchPending?window.setInterval(sync,30000):undefined;
    return()=>{request?.abort();window.removeEventListener("focus",sync);if(timer)window.clearInterval(timer);};
  },[path,watchPending]);
  useEffect(()=>{const dialog=ref.current!;if(version&&!dialog.open)dialog.showModal();if(!version&&dialog.open)dialog.close();},[version]);
  return <dialog ref={ref} className={styles.dialog} aria-labelledby="approval-title" aria-describedby="approval-description" onCancel={event=>event.preventDefault()}>
    <h2 id="approval-title">이용 승인 완료</h2><p id="approval-description">HANDA 이용이 승인되었습니다. 이제 비즈니스 위키를 읽고 글을 작성할 수 있습니다.</p>{error&&<p role="alert">{error}</p>}
    <div className={styles.controls}><button type="button" autoFocus className={`${common.button} ${common.primary}`} disabled={pending} onClick={()=>{const shownVersion=version!;startTransition(async()=>{setError("");try{const result=await confirmApproval(shownVersion);if(result.ok){acknowledged.current=Math.max(acknowledged.current,shownVersion);setVersion(current=>current===shownVersion?null:current);}else setError(result.message??"다시 시도해 주세요.");}catch{setError("확인 내용을 저장하지 못했습니다. 다시 시도해 주세요.");}});}}>{pending?"확인 중…":"확인"}</button></div>
  </dialog>;
}
