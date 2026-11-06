"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import type { AccountProfile } from "@/lib/auth/account-profile";
import common from "@/app/login/auth.module.css";
import styles from "./profile.module.css";

type Message={text:string;error:boolean};
const empty={text:"",error:false};
export default function ProfileForm({profile,emailEnabled}:{profile:Pick<AccountProfile,"name"|"email"|"image"|"googleLinked"|"hasPassword">;emailEnabled:boolean}){
  const router=useRouter();const [busy,setBusy]=useState<string|null>(null);
  const [name,setName]=useState(profile.name);const [newEmail,setNewEmail]=useState("");
  const [currentPassword,setCurrentPassword]=useState("");const [newPassword,setNewPassword]=useState("");const [confirmation,setConfirmation]=useState("");
  const [nameMessage,setNameMessage]=useState<Message>(empty);const [emailMessage,setEmailMessage]=useState<Message>(empty);const [passwordMessage,setPasswordMessage]=useState<Message>(empty);
  const credential=profile.hasPassword&&!profile.googleLinked;
  const photo=profile.image && (profile.image.startsWith("https://")||profile.image.startsWith("/")&&!profile.image.startsWith("//"))?profile.image:null;
  const message=(value:Message)=>value.text?<p role={value.error?"alert":"status"} className={`${common.message} ${value.error?common.error:""}`}>{value.text}</p>:null;
  return <div className={styles.sections}>
    <section className={common.box} aria-labelledby="profile-photo-title"><h2 id="profile-photo-title">프로필 사진</h2><div className={styles.photoRow}><div className={styles.avatar}>{photo?<Image src={photo} alt="내 프로필 사진" width={88} height={88} unoptimized/>:<span aria-hidden="true">{profile.name.slice(0,1)}</span>}</div><div><button type="button" className={common.button} disabled>사진 변경 (준비 중)</button><p className={common.help}>프로필 사진 첨부 기능은 추후 추가됩니다.</p></div></div></section>
    <section className={common.box} aria-labelledby="profile-name-title"><h2 id="profile-name-title">이름</h2><form className={common.form} onSubmit={async event=>{event.preventDefault();if(busy)return;const value=name.trim();if(!value||value.length>100){setNameMessage({text:"이름은 1~100자로 입력해 주세요.",error:true});return;}setBusy("name");setNameMessage(empty);try{const result=await authClient.updateUser({name:value});if(result.error)throw new Error();setName(value);setNameMessage({text:"이름을 변경했습니다.",error:false});router.refresh();}catch{setNameMessage({text:"이름을 변경하지 못했습니다. 다시 로그인한 뒤 시도해 주세요.",error:true});}finally{setBusy(null);}}}>
      <label>이름<input name="name" autoComplete="name" value={name} required maxLength={100} disabled={busy!==null} onChange={event=>setName(event.target.value)}/></label><p className={common.help}>이름 변경은 HANDA에만 반영됩니다.</p><button className={`${common.button} ${common.primary}`} disabled={busy!==null}>{busy==="name"?"변경 중…":"이름 변경"}</button>{message(nameMessage)}
    </form></section>
    <section className={common.box} aria-labelledby="profile-email-title"><h2 id="profile-email-title">이메일</h2><label className={styles.readonly}>현재 이메일<input type="email" value={profile.email} readOnly aria-readonly="true"/></label>
      {profile.googleLinked?<p className={common.help}>Google로 연결된 이메일입니다. 이 화면에서는 이메일과 Google 비밀번호를 변경하지 않습니다.</p>:credential?<form className={common.form} onSubmit={async event=>{event.preventDefault();if(busy)return;if(newEmail.trim().toLowerCase()===profile.email.toLowerCase()){setEmailMessage({text:"현재 이메일과 다른 주소를 입력해 주세요.",error:true});return;}setBusy("email");setEmailMessage(empty);try{const result=await authClient.changeEmail({newEmail:newEmail.trim(),callbackURL:"/account"});if(result.error)throw new Error();setNewEmail("");setEmailMessage({text:"이메일 변경 요청을 접수했습니다. 기존 이메일의 확인 링크를 누른 뒤 새 이메일 주소도 확인해 주세요. 모두 확인하기 전까지 현재 주소가 유지됩니다.",error:false});}catch{setEmailMessage({text:"이메일 변경 요청을 처리하지 못했습니다. 다시 로그인한 뒤 시도해 주세요.",error:true});}finally{setBusy(null);}}}>
        <label>새 이메일<input type="email" name="newEmail" autoComplete="email" value={newEmail} required maxLength={254} disabled={busy!==null||!emailEnabled} onChange={event=>setNewEmail(event.target.value)}/></label><p className={common.help}>{emailEnabled?"기존 이메일과 새 이메일을 모두 확인한 뒤 로그인 주소가 변경됩니다.":"현재 이메일 변경을 준비 중입니다."}</p><button className={common.button} disabled={busy!==null||!emailEnabled}>{busy==="email"?"요청 중…":"이메일 변경 요청"}</button>{message(emailMessage)}
      </form>:<p className={common.help}>연결된 로그인 계정에서 이메일을 관리합니다.</p>}
    </section>
    {credential&&<section className={common.box} aria-labelledby="profile-password-title"><h2 id="profile-password-title">비밀번호</h2><p className={common.help}>현재 비밀번호는 표시하지 않습니다. 변경하면 다른 기기의 로그인은 해제됩니다.</p><form className={common.form} onSubmit={async event=>{event.preventDefault();if(busy)return;if(newPassword!==confirmation){setPasswordMessage({text:"새 비밀번호가 일치하지 않습니다.",error:true});return;}setBusy("password");setPasswordMessage(empty);try{const result=await authClient.changePassword({currentPassword,newPassword,revokeOtherSessions:true});if(result.error){setPasswordMessage({text:result.error.code==="INVALID_PASSWORD"?"현재 비밀번호를 확인해 주세요.":"비밀번호를 변경하지 못했습니다. 현재 비밀번호와 길이를 확인하거나 다시 로그인해 주세요.",error:true});return;}setCurrentPassword("");setNewPassword("");setConfirmation("");setPasswordMessage({text:"비밀번호를 변경했습니다.",error:false});router.refresh();}catch{setPasswordMessage({text:"비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.",error:true});}finally{setBusy(null);}}}>
      <label>현재 비밀번호<input type="password" autoComplete="current-password" value={currentPassword} required maxLength={128} disabled={busy!==null} onChange={event=>setCurrentPassword(event.target.value)}/></label><label>새 비밀번호<input type="password" autoComplete="new-password" value={newPassword} required minLength={12} maxLength={128} disabled={busy!==null} onChange={event=>setNewPassword(event.target.value)}/></label><label>새 비밀번호 확인<input type="password" autoComplete="new-password" value={confirmation} required minLength={12} maxLength={128} disabled={busy!==null} onChange={event=>setConfirmation(event.target.value)}/></label><p className={common.help}>12~128자로 입력해 주세요.</p><button className={common.button} disabled={busy!==null}>{busy==="password"?"변경 중…":"비밀번호 변경"}</button>{message(passwordMessage)}
    </form></section>}
  </div>;
}
