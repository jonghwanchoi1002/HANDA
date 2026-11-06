import { getCurrentUser } from "@/lib/auth/session";
import { getApprovalNotice } from "@/lib/auth/account-profile";
import { getDatabase } from "@/lib/content/database";
import ApprovalNoticeDialog from "./approval-notice-dialog";
export default async function ApprovalNotice(){
  const user=await getCurrentUser();if(!user)return null;
  const version=await getApprovalNotice(getDatabase(),user.id);
  return <ApprovalNoticeDialog key={`${user.id}:${version??0}`} initialVersion={version} watchPending={user.approvalStatus==="pending"}/>;
}
