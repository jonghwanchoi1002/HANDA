import { getCurrentUser } from "@/lib/auth/session";
import ApprovalNoticeDialog from "./approval-notice-dialog";
export default async function ApprovalNotice(){
  const user=await getCurrentUser();if(!user)return null;
  return <ApprovalNoticeDialog key={user.id}/>;
}
