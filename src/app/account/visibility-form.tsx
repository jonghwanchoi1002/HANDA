"use client";
import { useActionState, useState } from "react";
import { profileVisibilityLabels, type ProfileVisibility } from "@/lib/auth/profile-visibility";
import { saveProfileVisibility } from "./actions";
import common from "@/app/login/auth.module.css";
import styles from "./profile.module.css";
export default function VisibilityForm({initialValue}:{initialValue:ProfileVisibility}){
  const [value,setValue]=useState(initialValue);const [state,action,pending]=useActionState(saveProfileVisibility,{message:"",success:false});
  return <section className={common.box} aria-labelledby="visibility-title"><h2 id="visibility-title">개인정보 공개 범위</h2><p className={common.help}>앞으로 추가할 회원 프로필 공개 기능에 적용할 설정입니다. 현재는 설정만 저장합니다.</p>
    <form action={action} className={common.form}><label>공개 범위<select className={styles.select} name="visibility" value={value} disabled={pending} onChange={event=>setValue(event.target.value as ProfileVisibility)}>{Object.entries(profileVisibilityLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
      <p className={common.help}>로그인용 이메일과 비밀번호는 공개 범위에 포함하지 않습니다.</p><button className={common.button} disabled={pending}>{pending?"저장 중…":"공개 범위 저장"}</button>{state.message&&<p role={state.success?"status":"alert"} className={`${common.message} ${state.success?"":common.error}`}>{state.message}</p>}
    </form>
  </section>;
}
