import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccountProfile } from "@/lib/auth/account-profile";
import { getDatabase } from "@/lib/content/database";
import { authAvailability } from "@/lib/auth/server";
import { canReadWiki } from "@/lib/auth/permissions";
import AccountShell from "@/components/account-shell";
import ApprovalWaiting from "./approval-waiting";
import VisibilityForm from "./visibility-form";
import HandaHistory from "./handa-history";
import ProfileForm from "./profile-form";
import styles from "@/app/login/auth.module.css";
export const instant=false;
export const metadata:Metadata={title:"내 계정 | HANDA",robots:{index:false,follow:false}};
export default async function AccountPage(){
  const user=await getCurrentUser();if(!user)redirect("/login");
  if(user.approvalStatus==="pending")return <AccountShell><ApprovalWaiting/></AccountShell>;
  if(!canReadWiki(user))return <AccountShell><p className={styles.intro}>{user.approvalStatus==="rejected"?"이용 승인이 중지되었습니다. 관리자에게 문의해 주세요.":"이메일 확인이 필요합니다."}</p></AccountShell>;
  const profile=await getAccountProfile(getDatabase(),user.id);if(!profile)redirect("/login");
  return <AccountShell><p className={styles.eyebrow}>MY HANDA</p><h1>{profile.name}님, 안녕하세요.</h1><p className={styles.intro}>개인정보를 확인하고 변경할 수 있습니다.</p><ProfileForm profile={{name:profile.name,email:profile.email,image:profile.image,googleLinked:profile.googleLinked,hasPassword:profile.hasPassword}} emailEnabled={authAvailability().email}/><VisibilityForm initialValue={profile.profileVisibility}/><HandaHistory joinedAt={profile.joinedAt}/></AccountShell>;
}
